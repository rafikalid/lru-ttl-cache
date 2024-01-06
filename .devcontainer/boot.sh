bootstrap(){
	# Install yarn 3
	# corepack enable; This is done in dockerfile
	# yarn init -2
	# yarn set version stable
	yarn install

	# Config git
	echo "Git Config >>"
	read -r -p "Your user.name: " userName
	read -r -p "Your user.email: " email
	git config --global user.name $userName
	git config --global user.email $email
}

bootstrap
if [ "$?" -gt "0" ]; then
	echo "Faild. You can run this script again using this command: `bash .devcontainer/boot.sh`" >&2
else
	echo "Done."
fi