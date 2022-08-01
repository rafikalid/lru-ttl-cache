# ARG VARIANT=14-buster
# ARG VARIANT=16-buster
ARG VARIANT=18-buster
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# Update container
RUN sudo apt update && sudo apt upgrade -y
# Install python
RUN sudo apt install python2 -y