'use client';
import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import './coding.css';

export default function CodingPage() {
  const [code, setCode] = useState("print('Hello, Agent 007')\n");

  const runLocally = () => {
    try {
      // 临时执行，仅浏览器端安全 sandbox 模拟
      const output = eval(code.replace(/print\((.*)\)/g, 'console.log($1)'));
      console.log(output);
      alert('✅ Simulated Execution:\n' + code);
    } catch (e: any) {
      alert('⚠️ Execution error:\n' + e.message);
    }
  };

  return (
    <main className="coding-root">
      <section className="editor-panel">
        <h1 className="title">Mission: Code Collaboration</h1>
        <p className="subtitle">
          Write Python, review logic, and prepare for your mock interview mission.
        </p>

        <div className="editor-container">
          <CodeMirror
            value={code}
            height="400px"
            theme="dark"
            extensions={[python()]}
            onChange={setCode}
            className="editor"
          />
        </div>

        <div className="action-buttons">
          <button className="btn-elegant" onClick={runLocally}>Run Locally</button>
          <a href="/" className="btn-ghost">Return HQ</a>
        </div>
      </section>
    </main>
  );
}
