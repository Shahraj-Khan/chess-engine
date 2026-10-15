import './Hero.css'

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__heading">
        <span className="eyebrow">Your personal chess arena</span>
        <h1 className="hero__title" id="hero-title">
          Think. Play. <em>Improve.</em>
        </h1>
      </div>
      <p className="hero__lead">Your board. Your strategy. Your engine.</p>
    </section>
  )
}
