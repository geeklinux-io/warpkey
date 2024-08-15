# CloudFlare Warp KEY Collection Tool

[English](README.md) | [简体中文](README_CN.md) 

## Direct Access

You can directly access Warp KEY from the following URL (Update data every hour):

- [https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/lite](https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/lite)
- [https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full](https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full)

You can also obtain it through my GitHub Pages:[CloudFlare WARP Key (geeklinux-io.github.io)](https://geeklinux-io.github.io/warpkey/)

## Private Deployment

### 1. Install Go

Make sure you have Go installed. You can download and install Go from the [official Go website](https://golang.org/dl/).

### 2. Clone the Project

Clone this repository to your local environment:

```bash
git clone https://github.com/geeklinux-io/warpkey.git
cd warpkey
```

### 3. Configure

If needed, you can edit the `main.go` file to adjust configurations.

### 4. Run/Build

Once the Go environment is set up, you can use the following command to package the application:

```bash
chmod a+x build.sh
./build.sh
```
You can find the program you have compiled in the `./build` directory under the current directory.

The tool will collect keys from Telegram and save them in the `./data` directory under the current directory.

If you want to request the CloudFlare Key through a specific Socket or HTTP proxy, you can use the -- proxy parameter. Of course, you can also use the program - h to view specific usage help


## 5. Auto Update

You can use crontab to schedule tasks to execute the `update.sh `script in your project and submit the updates to your GitHub repository

## License

This project is licensed under the MIT License. For more details, please see the [LICENSE](LICENSE) file.

