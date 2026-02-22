import './App.css'

function App() {
  return (
    <>
      <h1>auto-poc</h1>
      <p className="subtitle">
        GitHub Issue → AI Agent → Pull Request, fully automated.
      </p>
      <div className="card">
        <h2>How it works</h2>
        <ol>
          <li>Label a GitHub issue <code>agent-ready</code></li>
          <li>A Codespace spins up automatically</li>
          <li>Claude Code reads the issue, plans, implements, and verifies the changes</li>
          <li>A pull request is opened with a structured summary and screenshots</li>
          <li>Review comments trigger another agent pass to address feedback</li>
          <li>Human reviews and merges</li>
        </ol>
      </div>
      <p className="read-the-docs">
        The only human touchpoints are writing the issue and merging the PR.
      </p>
    </>
  )
}

export default App
