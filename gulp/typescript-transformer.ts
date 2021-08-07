import {join, relative, dirname, sep as PathSep} from 'path'
import ts from 'typescript'
import {statSync} from 'fs';
const isWindows= PathSep==='\\';

/** Resolve import @ */
export function createImportTransformer(compilerOptions: ts.CompilerOptions){
	//Checks 
	if(typeof compilerOptions.baseUrl !== 'string')
		throw new Error('Expected options.baseUrl as string!');
	if(compilerOptions.paths==null)
		throw new Error('Expected options.paths as Record<string, string[]>')
	// Base dir
	const paths=	compilerOptions.paths;
	const baseDir=	join(process.cwd(), compilerOptions.baseUrl);
	// Prepare map
	var pathMap= new Map();
	var k: string;
	for(k in paths){
		var v= paths[k];
		if(v.length != 1)
			throw new Error(`Expected path to have only one entry, found ${v.length} at ${k}`);
		// remove trailing slash
		k= k.replace(/\/\*?$/, '');
		pathMap.set(k, join(baseDir, v[0].replace(/\/\*?$/, '')));
	}
	/** Replace @ */
	const replacerRegex= /^(@[^\/\\'"`]+)/;

	/** Return transformer */
	return function(ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile>{
		var factory= ctx.factory;
		return function(sf: ts.SourceFile): ts.SourceFile{
			/** File name */
			const fileName= sf.fileName;
			const _dirname= dirname(fileName);
			// return
			return _visitor(sf) as ts.SourceFile;
			/** Import visitor */
			function _visitor(node:ts.Node): ts.Node{
				if(ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly){
					//* Import declartion
					return factory.createImportDeclaration(
						node.decorators,
						node.modifiers,
						node.importClause,
						factory.createStringLiteral(_resolve(node.moduleSpecifier.getText()))
					)
				} else if(ts.isExportDeclaration(node) && node.moduleSpecifier){
					//* Export declaration
					return factory.createExportDeclaration(
						node.decorators,
						node.modifiers,
						node.isTypeOnly,
						node.exportClause,
						factory.createStringLiteral(_resolve(node.moduleSpecifier.getText()))
					);
				} else if(ts.isCallExpression(node) && node.expression.kind===ts.SyntaxKind.ImportKeyword){
					//* Dynalic import
					if(node.arguments.length !== 1)
						throw new Error(`Dynamic import must have one specifier as an argument at ${fileName}: ${node.getText()}`);
					var expr: ts.Expression= node.arguments[0];
					if(ts.isStringLiteral(expr)){
						expr= factory.createStringLiteral(_resolve(node.arguments[0].getText()))
					} else {
						expr= ts.visitEachChild<ts.Expression>(expr, function(n: ts.Node){
							if(ts.isStringLiteral(n))
								n= factory.createStringLiteral(_resolve(n.getText()));
							return n;
						}, ctx);
					}
					return factory.createCallExpression(
						node.expression,
						node.typeArguments,
						[expr]
					);
				}
				return ts.visitEachChild(node, _visitor, ctx);
			}
			/** Resolve import specifier */
			function _resolve(path: string){
				// Remove quotes, parsing using JSON.parse fails on simple quotted strings
				//TODO find better solution to parse string
				path= path.slice(1, path.length-1);
				// replace @specifier
				let startsWithAt;
				if((startsWithAt= (path.charAt(0)==='@')) || path.charAt(0)==='.'){
					// get absolute path
					if(startsWithAt)
						path= path.replace(replacerRegex, _replaceCb);
					else
						path= join(_dirname, path);
					// check file exists
					path= _resolveFilePath(path);
					// create relative path to current file
					path= relative(_dirname, path);
					// Replace windows antislashes
					if(isWindows) path= path.replace(/\\/g, '/');
					// Add prefix "./"
					if(path.charAt(0)==='/') path= '.'+path;
					else if(path.charAt(0)!=='.') path= './'+path;
				}
				return path;
			}
			// Path replacer
			function _replaceCb(txt: string, k: string){
				return pathMap.get(k) ?? txt;
			}
			// Resolve file path
			function _resolveFilePath(path: string){
				try{
					if(statSync(path).isDirectory())
						path= join(path, 'index.js');
				}catch(e){
					try{
						if(statSync(path+'.ts').isFile())
							path+='.js';
					}catch(e){
						try{
							if(!path.endsWith('.js') && statSync(path+'.js').isFile())
								path+='.js';
						}catch(e){
							console.error(e);
						}
					}
				}
				return path;
			}
		};
	}
}