# Why to use?
- This will automatically install any required dependencies
- The development environment is independent of your own host (no more "It works on my machine" problem)
- Isolated Environment: Protect your host by running scripts on the container and preventing them from accessing your machine and files.
- Customize your vscode for this project without affecting your default options.
- Customize environment without affecting your machine (node version, ...)

# Get started
1. Install docker
1. Enable remote-container on your vsCode: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
2. Open the folder using your vsCode.
3. For the first time, vsCode will prompt to you to reopen the project using the container.
4. Answer any question asked (email, SSH key, ...)
5. Go grab a coffee, it's gonna take some time ( from 20mins to 2 hours :D ).

If it fails. Add more memory and CPU to your container on the 