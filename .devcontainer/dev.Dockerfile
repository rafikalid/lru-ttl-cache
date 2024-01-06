# ARG VARIANT=14-buster
# ARG VARIANT=16-buster
# ARG VARIANT=18-buster
# ARG VARIANT=18-bullseye
FROM "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye"

# Update container
RUN sudo apt update && sudo apt upgrade -y

# Update yarn
RUN sudo npm install --global yarn

# Bash configuration
RUN echo "export NODE_OPTIONS=--max_old_space_size=4096" >> /etc/bash.bashrc

RUN sudo corepack enable 
