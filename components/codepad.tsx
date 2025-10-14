"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { api } from "@/lib/api";

type Props = { onExit?: () => void };

export default function CodePad({ onExit }: Props) {
  const [code, setCode] = useState<string>([
    "print('hello from CodePad')",
    "for i in range(3):",
    "    print('line', i+1)",
  ].join("\n"));
  const [stdout, setStdout] = useState<string>("");
  const [stderr, setStderr] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 快捷键：Ctrl/Cmd + Enter 运行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => run());

    // 快捷键：Ctrl/Cmd + L 清空输出
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => clearOutput());
  };

  const run = useCallback(async () => {
    const src = (editorRef.current?.getValue() ?? code).trim();
    if (!src) return;
    setRunning(true);
    try {
      const res = await api.run.python(src);
      setStdout(res.stdout || "");
      setStderr(res.stderr || "");
    } catch (e: any) {
      setStderr(e?.message || "Run failed");
    } finally {
      setRunning(false);
    }
  }, [code]);

  const clearOutput = useCallback(() => {
    setStdout("");
    setStderr("");
  }, []);

  const exit = useCallback(() => {
    // 清 cookie 并回到 lobby
    document.cookie = `room_access=; Path=/; Max-Age=0; SameSite=Lax`;
    onExit?.();
  }, [onExit]);

  // 小屏时收起 minimap
  const editorOptions = useMemo(
    () => ({
      language: "python",
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: "on" as const,
      wordWrap: "on" as const,
      tabSize: 4,
      renderWhitespace: "selection" as const,
      scrollBeyondLastLine: false,
      cursorBlinking: "smooth" as const,
    }),
    []
  );

  // 提前加载 python 语言（monaco 内置）
  useEffect(() => {
    // 仅占位说明，可根据需要额外注册 snippet 或 LSP
  }, []);

  return (
    <div className="codepad-root">
      {/* 顶部工具栏 */}
      <div className="codepad-toolbar">
        <div className="left">
          <span className="brand">DONFRA</span>
          <span className="brand-sub">CodePad</span>
        </div>
        <div className="right">
          <button className="btn ghost" onClick={clearOutput} title="Clear output (Ctrl/Cmd+L)">
            Clear
          </button>
          <button className="btn run" onClick={run} disabled={running} title="Run (Ctrl/Cmd+Enter)">
            {running ? "Running…" : "Run"}
          </button>
          <button className="btn danger" onClick={exit}>
            Exit
          </button>
        </div>
      </div>

      {/* 主区域：编辑器 + 终端，全屏铺满 */}
      <div className="codepad-main">
        <div className="editor-pane" aria-label="code editor">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            onMount={handleMount}
            options={editorOptions}
          />
        </div>

        <div className="terminal-pane" aria-label="terminal output">
          <div className="terminal-header">Terminal</div>
          <div className="terminal-body">
            {stdout && (
              <>
                <div className="stream-title ok">$ stdout</div>
                <pre className="stream">{stdout}</pre>
              </>
            )}
            {stderr && (
              <>
                <div className="stream-title warn">$ stderr</div>
                <pre className="stream error">{stderr}</pre>
              </>
            )}
            {!stdout && !stderr && (
              <div className="empty">no output</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
