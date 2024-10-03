# CloudFlare Warp KEY 收集工具

[English](README.md) | [简体中文](README_CN.md)

我的博客：https://www.wanghaoyu.com.cn/archives/cloudflare-warp-key.html

## 获取KEY

可以从以下 URL 直接获取 Warp KEY（每隔一小时更新数据）：

- [https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full](https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/lite)
- [https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full](https://raw.githubusercontent.com/geeklinux-io/warpkey/main/data/full)

也可以通过我的GitHub Pages中获取：[CloudFlare WARP Key (geeklinux-io.github.io)](https://geeklinux-io.github.io/warpkey/)



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

构建好的应用程序会自动放置到当前所在目录的`build`目录中。

该工具将从 Telegram 收集密钥，并将其保存在当前目录下的`/data`目录中。

你也可以通过特定的Socket 或者HTTP代理去请求获取 CloudFlare Key 可以使用 --proxy 参数，当然，你也可以使用 程序 -h 查看具体的使用帮助。

## 5. 自动更新

您可以使用crontab计划任务执行项目中的update.sh脚本，并将更新提交到您的GitHub存储库中。

## 许可

该项目使用 MIT 许可。有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

