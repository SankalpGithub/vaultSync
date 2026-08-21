import Link from "next/link";

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="nav-wrap" aria-label="Main navigation">
        <Link className="brand" href="#top" aria-label="VaultSync home">
          <span className="brand-mark">V</span>
          VaultSync<span className="brand-dot">.</span>
        </Link>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#security">Security</a>
          <a href="#documentation">Documentation</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        <Link className="button button-small button-dark" href="/auth/signup">
          Get started <span>↗</span>
        </Link>
      </nav>

      <section className="hero section-pad" id="top">
        <div className="hero-copy reveal">
          <p className="eyebrow">
            <span className="eyebrow-line" /> Secure by default
          </p>
          <h1>
            Your secrets.
            <br />
            <em>Securely synced.</em>
          </h1>
          <p className="hero-subtitle">
            VaultSync gives developers and teams a secure way to store, manage,
            and access application secrets, without exposing sensitive
            credentials in code, <code>.env</code> files, or repositories.
          </p>
          <div className="hero-actions">
            <Link className="button button-accent" href="/auth/signup">
              Get started <span>↗</span>
            </Link>
            <a className="button button-ghost" href="#documentation">
              View documentation <span>→</span>
            </a>
          </div>
          <p className="supporting-text">
            <span className="mini-lock">⌁</span> Secure your API keys, database
            credentials, tokens, and application secrets from development to
            production.
          </p>
        </div>
        <div className="hero-visual reveal reveal-delay">
          <div className="visual-glow" />
          <div className="vault-window">
            <div className="window-top">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="window-label">vaultsync / dashboard</span>
              <span className="window-status">● live</span>
            </div>
            <div className="vault-content">
              <div className="vault-heading">
                <div>
                  <p className="label-muted">PROJECT / MY-API</p>
                  <h2>Production</h2>
                </div>
                <span className="lock-badge">⌁ encrypted</span>
              </div>
              <div className="secret-list">
                {[
                  "DATABASE_URL",
                  "STRIPE_SECRET_KEY",
                  "JWT_SECRET",
                  "AWS_ACCESS_KEY",
                ].map((secret, index) => (
                  <div className="secret-row" key={secret}>
                    <span className="secret-icon">
                      {["◈", "✦", "◇", "◆"][index]}
                    </span>
                    <span>{secret}</span>
                    <b>••••••••••••••</b>
                    <span className="row-menu">•••</span>
                  </div>
                ))}
              </div>
              <div className="vault-footer">
                <span>
                  <i className="green-dot" /> 4 secrets protected
                </span>
                <span>Updated just now</span>
              </div>
            </div>
          </div>
          <div className="float-note">
            <span className="check-circle">✓</span>
            <span>
              <strong>All systems secure</strong>
              <small>Last audit · 2 min ago</small>
            </span>
          </div>
        </div>
      </section>

      <section className="trust-band">
        <p>Trusted workflow for teams that ship</p>
        <div className="stack-words">
          <span>NODE.JS</span>
          <span>
            TYPE<span className="orange">SCRIPT</span>
          </span>
          <span>PYTHON</span>
          <span>DOCKER</span>
          <span>AWS</span>
          <span>CI / CD</span>
        </div>
      </section>

      <section className="statement section-pad">
        <p className="section-kicker">The old way is broken</p>
        <h2>
          Stop putting secrets
          <br />
          <em>where they don&apos;t belong.</em>
        </h2>
        <p>
          Environment files, hardcoded credentials, shared documents, and chat
          messages weren&apos;t designed to manage production secrets.
        </p>
        <strong>VaultSync provides one secure place for them.</strong>
      </section>

      <section className="features section-pad" id="features">
        <div className="section-heading">
          <div>
            <p className="section-kicker">A better foundation</p>
            <h2>
              Everything you need to
              <br />
              <em>manage secrets securely.</em>
            </h2>
          </div>
          <p>
            Less hunting. Less risk. More time building the things your users
            actually see.
          </p>
        </div>
        <div className="feature-grid">
          {[
            [
              "01",
              "Secure secret storage",
              "Store API keys, tokens, credentials, and sensitive configuration in a centralized encrypted vault.",
              "⌁",
            ],
            [
              "02",
              "Team access control",
              "Control who can access your secrets with role-based permissions and controlled access.",
              "◎",
            ],
            [
              "03",
              "Environment management",
              "Keep development, staging, and production secrets separated and organized.",
              "⌘",
            ],
            [
              "04",
              "Audit logs",
              "Know who accessed or changed a secret and when, with a clear history of every action.",
              "◷",
            ],
            [
              "05",
              "Developer friendly",
              "Simple APIs, environment-based configuration, and easy integration with your applications.",
              "⌘",
            ],
            [
              "06",
              "No secrets in Git",
              "Code belongs in Git. Secrets belong in VaultSync.",
              "⊘",
            ],
          ].map(([number, title, text, icon]) => (
            <article className="feature-card" key={number}>
              <div className="feature-top">
                <span className="feature-icon">{icon}</span>
                <span className="feature-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="card-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="process section-pad" id="how-it-works">
        <div className="section-heading">
          <div>
            <p className="section-kicker">From zero to protected</p>
            <h2>
              Secure your application
              <br />
              <em>in three steps.</em>
            </h2>
          </div>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <div>
              <h3>Create a vault</h3>
              <p>Create a vault for your project and environment.</p>
              <code>my-api / production</code>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Add your secrets</h3>
              <p>
                Store your API keys, database URLs, tokens, and other sensitive
                configuration securely.
              </p>
              <code>DATABASE_URL ········</code>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Connect your application</h3>
              <p>
                Your application retrieves the secrets it needs through secure
                authentication and APIs.
              </p>
              <code>vaultsync secrets pull</code>
            </div>
          </article>
        </div>
        <p className="process-end">
          That&apos;s it. Your secrets stay out of your codebase. <span>↘</span>
        </p>
      </section>

      <section className="developer section-pad">
        <div className="developer-copy">
          <p className="section-kicker">Fits your workflow</p>
          <h2>
            Built for developers,
            <br />
            <em>not around them.</em>
          </h2>
          <p>
            VaultSync fits naturally into the tools you already use. A small
            command, a big improvement in how your team ships.
          </p>
          <Link className="text-link" href="#documentation">
            Explore the docs <span>→</span>
          </Link>
        </div>
        <div className="code-panel">
          <div className="code-title">
            <span className="window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>terminal</span>
            <span>⌘ K</span>
          </div>
          <pre>
            <span className="comment"># Instead of this</span>
            {"\n"}
            <span className="red">DATABASE_URL</span>=
            <span className="yellow">
              &quot;mongodb://user:password@...&quot;
            </span>
            {"\n\n"}
            <span className="comment"># Use VaultSync</span>
            {"\n"}
            <span className="green">$ vaultsync secrets pull</span>
            <br />
            <br />
            <span className="comment">✓ 4 secrets synced to my-api</span>
          </pre>
        </div>
      </section>

      <section className="security section-pad" id="security">
        <div className="security-intro">
          <p className="section-kicker">Quietly working in the background</p>
          <h2>
            Security isn&apos;t a feature.
            <br />
            <em>It&apos;s the foundation.</em>
          </h2>
        </div>
        <div className="security-grid">
          {[
            [
              "⌁",
              "Encryption",
              "Protect sensitive secret data using strong encryption.",
            ],
            [
              "◇",
              "Access control",
              "Only authorized users and services can access protected secrets.",
            ],
            [
              "◷",
              "Auditability",
              "Track important actions across your vaults and secrets.",
            ],
            [
              "⌑",
              "Authentication",
              "Secure access using authenticated users and service credentials.",
            ],
            [
              "◌",
              "Environment isolation",
              "Keep development and production secrets separated.",
            ],
          ].map(([icon, title, text]) => (
            <div className="security-item" key={title}>
              <span>{icon}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="architecture section-pad">
        <div className="architecture-copy">
          <p className="section-kicker">The secure middle layer</p>
          <h2>
            One secure layer between
            <br />
            <em>your applications and secrets.</em>
          </h2>
          <p>
            VaultSync puts authentication, access control, and encryption
            between your team and the credentials your systems depend on.
          </p>
        </div>
        <div className="architecture-diagram">
          <div className="diagram-node">
            Developer <span>01</span>
          </div>
          <div className="diagram-line">↓</div>
          <div className="diagram-node active">
            VaultSync API <span>02</span>
          </div>
          <div className="diagram-line">↓</div>
          <div className="diagram-node">
            Access control + encryption <span>03</span>
          </div>
          <div className="diagram-line">↓</div>
          <div className="diagram-node">
            Secure vault <span>04</span>
          </div>
          <div className="diagram-line">↓</div>
          <div className="diagram-node final">
            Your application <span>05</span>
          </div>
        </div>
      </section>

      <section className="comparison section-pad">
        <p className="section-kicker">A cleaner standard</p>
        <h2>
          Stop managing secrets
          <br />
          <em>the risky way.</em>
        </h2>
        <div className="comparison-table">
          <div className="table-head">
            <span>Traditional approach</span>
            <span>VaultSync</span>
          </div>
          {[
            ["Secrets in .env files", "Centralized vault"],
            ["Credentials in repositories", "Secrets kept outside Git"],
            ["Manual sharing", "Controlled access"],
            ["No visibility", "Audit logs"],
            ["Difficult environment management", "Environment-based vaults"],
            ["Scattered credentials", "One secure system"],
          ].map(([oldWay, newWay]) => (
            <div className="table-row" key={oldWay}>
              <span>
                <b>×</b>
                {oldWay}
              </span>
              <span>
                <b>✓</b>
                {newWay}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="cta section-pad" id="documentation">
        <div>
          <p className="section-kicker">The next deploy starts here</p>
          <h2>
            Your code is public enough.
            <br />
            <em>Keep your secrets private.</em>
          </h2>
          <p>
            Secure your application&apos;s sensitive configuration with
            VaultSync.
          </p>
        </div>
        <div className="cta-actions">
          <Link className="button button-accent" href="/auth/signup">
            Get started <span>↗</span>
          </Link>
          <a className="button button-light" href="#top">
            Read the docs <span>→</span>
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <Link className="brand" href="#top">
            <span className="brand-mark">V</span>VaultSync
            <span className="brand-dot">.</span>
          </Link>
          <p>
            Secure secret management
            <br />
            for modern applications.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <b>Product</b>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#documentation">Documentation</a>
          </div>
          <div>
            <b>Developers</b>
            <a href="#how-it-works">API docs</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="#how-it-works">Guides</a>
          </div>
          <div>
            <b>Company</b>
            <a href="#security">About</a>
            <a href="#documentation">Contact</a>
            <a href="#security">Security</a>
          </div>
          <div>
            <b>Legal</b>
            <a href="#documentation">Privacy</a>
            <a href="#documentation">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 VaultSync. All rights reserved.</span>
          <span>Made for teams who ship carefully.</span>
        </div>
      </footer>
    </main>
  );
}
