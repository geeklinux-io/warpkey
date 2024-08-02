# CloudFlare Warp KEY 收集工具

[English](README.md) | [简体中文](README_CN.md)

## 直接访问

可以从以下 URL 直接获取 Warp KEY（每天早上6点自动更新）：

- [https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full](https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/lite)
- [https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full](https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full)



## 私有化部署

### 1. 安装 Go

请确保你已经安装了 Go。你可以从 [Go 官方网站](https://golang.org/dl/) 下载并安装 Go。

### 2. 克隆项目

将此仓库克隆到你的本地环境中：

```bash
git clone https://github.com/geeklinux-io/warpkey.git
cd warpkey
```

### 3. 配置

如有需要，可以编辑 `main.go` 文件以调整配置。

### 4. 运行/构建

在配置好 Go 环境之后，可以使用以下命令打包程序：

```bash
chmod a+x build.sh
./build.sh
```

该工具将从 Telegram 收集密钥，并将其保存在当前目录下的`/data`目录中

## 许可

该项目使用 MIT 许可。有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

