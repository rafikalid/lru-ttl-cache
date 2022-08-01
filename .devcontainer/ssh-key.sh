GITHUB_NEW_SSH_KEY="https://github.com/settings/ssh/new"
GITHUB_NEW_GPG_KEY="https://github.com/settings/gpg/new"

local mail
local filename
local key

echo "Generating your SSH keypair"

read -r -p "Please input your email address: " mail || return $?
read -r -p "Specify the filename of your key pair: " filename || return $?

if [ "$filename" == "" ]; then
	echo "Filename is mandatory"
	return 1
fi

# Create directory
PRIVATE_KEY="$SSH_FOLDER/$filename"
mkdir -p "$SSH_FOLDER" || return $?

# Generate key
ssh-keygen -t rsa -b 4096 -C "$mail" -f "$PRIVATE_KEY" || return $?

# past it to console
echo "Please copy your private key to your github, gitlab, ..."
echo "Open an other cli and write: cat $PRIVATE_KEY"
echo "Past it to " $GITHUB_NEW_SSH_KEY
read -s -r -p "Press enter once it is done to continue" || return $?

# GPG
echo "Generating your GPG keypair"
key=$(gpg --batch --quick-gen-key "$mail" rsa4096 "default" "never" 2>&1 | grep -E "gpg: key .*" | sed -r 's|gpg: key ([^[:space:]]*) .*|\1|') || return $?
echo "Please copy your GPG key below to your github"
echo "You should paste it at $GITHUB_NEW_GPG_KEY"
gpg --export --armor "$key"

# Apply
git config user.signingkey $key
git config commit.gpgsign true

# Done
echo "Done."

