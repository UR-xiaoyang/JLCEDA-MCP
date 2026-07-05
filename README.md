# JLCEDA MCP - EDA Bridge Plugin

> 🎉 v2.0 版本：支持所有 MCP 客户端的原生架构

JLCEDA MCP 是嘉立创 EDA 的 MCP 生态集成方案。v2.0 采用反转架构，让 EDA 插件作为 WebSocket 客户端连接到独立的 MCP 服务器，支持 Claude Desktop、OpenCode、Cline 等所有 MCP 客户端。

## 📐 架构设计（v2.0）

```
AI 客户端（Claude Desktop / OpenCode / Cline 等）
    ↓ stdio/JSON-RPC (MCP 协议)
原生 MCP 服务器（独立 Node.js 进程）
    • WebSocket 服务器（端口 8765）
    • 工具分发和结果转换
    ↓ WebSocket 通信
EDA Bridge 插件 v2.0（WebSocket 客户端）
    • 智能页面检测
    • 自动连接和重连
    • 执行 EDA 操作
    ↓ 全局 eda 对象
JLCEDA EDA API
```

### 🚀 创新特点

- ✅ **反转架构**：EDA 插件作为客户端，无需 IDE 扩展
- ✅ **支持所有 MCP 客户端**：Claude Desktop、OpenCode、Cline、继续添加中...
- ✅ **智能检测**：仅在原理图/PCB 页面自动连接
- ✅ **自动重连**：连接断开自动恢复

## 🔗 配套项目

**原生 MCP 服务器**：[JLCEDA-MCP-Server](https://github.com/UR-xiaoyang/JLCEDA-MCP-Server)

本仓库包含 EDA Bridge 插件（.eext），需要配合 MCP 服务器使用。

## 🛠️ 可用工具

### 基础工具

| 工具                   | 说明                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `jlceda_schematic_read`   | 读取当前原理图的完整电路语义快照，返回器件列表、引脚→网络名映射、网络连接关系与 DRC 检查结果 |
| `jlceda_schematic_review` | 读取全工程所有原理图页面的网表文件，覆盖多页电路，适合全局审查、BOM 核查与跨页信号追踪       |
| `jlceda_component_select` | 在 EDA 系统库中搜索候选器件，返回候选列表供 AI 选择                |
| `jlceda_component_place_auto`  | 自动放置器件到指定坐标                         |
| `jlceda_netlabel_place`   | 在指定器件引脚位置放置网络标签，通过网络标签代替导线实现电气连接，自动识别电源/地符号类型     |
| `jlceda_netlabel_modify`  | 修改已放置的网络标签名称，支持按引脚位置或图元 ID 查找并修改                      |

### 自动化工具

| 工具                   | 说明                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `jlceda_auto_wire_connect` | 自动连线功能，按网络名连接引脚 |
| `jlceda_schematic_auto_layout` | 原理图自动布局，优化器件位置 |
| `jlceda_schematic_auto_routing` | 原理图自动布线，自动连接导线 |

### 高级工具

| 工具           | 说明                                                                |
| ------------ | ------------------------------------------------------------------- |
| `jlceda_api_index`  | 列出所有可用的 EDA API 模块名称，用于浏览 API 命名空间全貌               |
| `jlceda_api_search` | 按关键词搜索具体 API 方法及其参数说明，便于 AI 定位所需接口           |
| `jlceda_eda_context`| 读取当前 EDA 页面的上下文信息，包括活动页类型与当前工程基本状态       |
| `jlceda_api_invoke` | 直接调用任意 EDA API 并将结果透传给 AI，适用于核心工具未覆盖的定制化任务           |

## 💡 使用说明

1. **启动流程**：
   - 先启动 MCP 客户端（如 Claude Desktop）→ MCP 服务器自动启动
   - 打开嘉立创 EDA，切换到原理图或 PCB 页面 → EDA 插件自动连接

2. **推荐使用网络标签连接**：AI 会使用 `jlceda_netlabel_place` 在器件引脚位置放置网络标签（如 VCC、GND、信号名等），通过相同网络名实现电气连接，避免绘制复杂导线路径。电源/地符号会自动识别并放置。

3. **连接状态查看**：在 EDA 中点击菜单 **MCP Bridge → 连接状态**，查看连接详情和统计信息。

4. **调试日志**：如遇问题，点击 **MCP Bridge → 查看调试日志** 排查。

## 🚀 快速开始

### 前置要求

- Node.js 20+
- JLCEDA EDA 专业版（最新版）
- 支持 MCP 的 AI 客户端（Claude Desktop / OpenCode / Cline 等）

### 安装步骤

#### 1. 安装 MCP 服务器

前往配套项目安装：[JLCEDA-MCP-Server](https://github.com/UR-xiaoyang/JLCEDA-MCP-Server)

```bash
git clone https://github.com/UR-xiaoyang/JLCEDA-MCP-Server.git
cd JLCEDA-MCP-Server
npm install
npm run build
```

#### 2. 安装 EDA Bridge 插件

**方式一：从 Release 下载（推荐）**

1. 前往 [Releases](https://github.com/UR-xiaoyang/JLCEDA-MCP/releases) 下载最新的 `.eext` 文件
2. 打开嘉立创 EDA → 扩展 → 扩展管理
3. 点击"从文件安装"
4. 选择下载的 `.eext` 文件
5. 重启 EDA

**方式二：从源码构建**

```bash
git clone https://github.com/UR-xiaoyang/JLCEDA-MCP.git
cd JLCEDA-MCP/mcp-bridge
npm install
npm run build
# 产物：../build/jlceda-mcp-bridge-2.0.0.eext
```

#### 3. 配置 MCP 客户端

详见 [JLCEDA-MCP-Server 配置指南](https://github.com/UR-xiaoyang/JLCEDA-MCP-Server#%E5%AE%89%E8%A3%85%E6%AD%A5%E9%AA%A4)

## 📝 注意事项

1. **必须同时安装**：MCP 服务器和 EDA Bridge 插件必须配合使用。
2. **端口配置**：默认使用端口 8765，如需修改需在两边同步更新。
3. **页面检测**：仅在原理图（documentType=1）或 PCB（documentType=3）页面自动连接。
4. **连接异常**：如遇连接问题，可点击 **MCP Bridge → 重启服务器** 手动重连。
5. **多页面场景**：同时打开多个 EDA 页面时，只有活动页面会连接，属正常现象。

---

## 🎯 v2.0 更新日志

### 架构变更

- ✅ **反转架构**：MCP 服务器作为 WebSocket 服务端，EDA 插件作为客户端
- ✅ **移除 mcp-hub**：不再需要 VS Code/Cursor 扩展
- ✅ **支持所有 MCP 客户端**：Claude Desktop、OpenCode、Cline 等

### 新增功能

- ✅ `netlabel_place` / `netlabel_modify` - 网络标签放置和修改
- ✅ `auto_wire_connect` - 自动连线
- ✅ `schematic_auto_layout` - 自动布局
- ✅ `schematic_auto_routing` - 自动布线  
- ✅ `component_place_auto` - 自动放置器件
- ✅ 连接状态监控和手动重启
- ✅ 智能页面检测
- ✅ 自动重连机制

### 修复问题

- ✅ 修复器件放置功能（按 pro-api-sdk 标准）
- ✅ 修复页面检测（使用 documentType）
- ✅ 修复状态显示（双重标记机制）
- ✅ 修复 WebSocket API（使用 register 方法）

---

## 开发说明

以下内容面向开发者与维护者。

### 仓库结构

```text
JLCEDA-MCP/
├─ mcp-hub/         VS Code/Cursor 扩展与 stdio MCP 运行时
├─ mcp-bridge/   嘉立创 EDA 扩展与桥接 WebSocket 客户端
├─ build/           构建产物输出目录（VSIX / EEXT）
└─ tool/            离线文档与资源生成辅助脚本
```

### 开发环境要求

- Node.js 20+
- npm
- VS Code 1.105+（mcp-hub 开发与调试）
- 嘉立创 EDA 专业版（mcp-bridge 安装与联调）

### 构建

**构建 mcp-hub：**

```bash
cd mcp-hub
npm install
npm run build
```

产物：`build/jlceda-mcp-hub.vsix`

**构建 mcp-bridge：**

```bash
cd mcp-bridge
npm install
npm run build
```

产物：`build/jlceda-mcp-bridge.eext`

### 本地联调流程

1. 在 VS Code 或 Cursor 中安装 mcp-hub 扩展。
2. 在侧边栏确认桥接监听地址，默认为 `ws://127.0.0.1:8765/bridge/ws`。
3. 在嘉立创 EDA 中安装 mcp-bridge，写入相同的桥接地址。
4. 打开 EDA 工程，确认 Bridge 已建立桥接连接。
5. 在聊天客户端调用工具，并观察侧边栏状态、连接列表与日志。

### 开发约定

1. 新增或变更工具定义时，同步更新 `mcp-hub/resources/mcp-tool-definitions.json`、对应 README 与 CHANGELOG。
2. 新增或变更桥接任务路径时，必须同时修改 mcp-hub 与 mcp-bridge 两端处理逻辑。
3. 调整桥接地址、端口、协议字段或角色模型时，同步更新相关 README 与 CHANGELOG。
4. 发布前执行两端构建，确认 VSIX 与 EEXT 均可成功生成。

### 相关文档

- [mcp-hub/README.md](./mcp-hub/README.md)
- [mcp-bridge/README.md](./mcp-bridge/README.md)
- [mcp-hub/CHANGELOG.md](./mcp-hub/CHANGELOG.md)
- [mcp-bridge/CHANGELOG.md](./mcp-bridge/CHANGELOG.md)

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可证。

