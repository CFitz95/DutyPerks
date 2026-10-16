
import Link from "next/link";

const categories = [
  { icon: "🏨", name: "Hotels & Stays", description: "Military-friendly places to stay" },
  { icon: "🍽️", name: "Food & Dining", description: "Savings on meals and treats" },
  { icon: "🎟️", name: "Attractions", description: "Explore more for less" },
  { icon: "🛍️", name: "Shopping", description: "Everyday military savings" },
  { icon: "🏕️", name: "Outdoor Adventures", description: "Get out and discover" },
  { icon: "✈️", name: "Travel", description: "Make your next trip count" },
];

const destinations = [
  {
    name: "San Diego",
    state: "California",
    description: "Beaches, attractions, dining, and military resources.",
    href: "/explore?location=San%20Diego",
  },
  {
    name: "Whidbey Island",
    state: "Washington",
    description: "Island adventures and military community resources.",
    href: "/explore?location=Whidbey%20Island",
  },
];

export default function Home() {
  return (
    <main className="dp-home">
      <section className="dp-hero">
        <div className="dp-hero-content">
          <span className="dp-eyebrow">MILITARY SAVINGS, MADE SIMPLE</span>
          <h1>
            Explore more.
            <br />
            <span>Spend less.</span>
          </h1>
          <p>
            Discover military discounts, explore destinations, and
            make the most of the benefits you&apos;ve earned.
          </p>

          <form action="/explore" method="GET" className="dp-search">
            <label htmlFor="destination">Where do you want to explore?</label>
            <div className="dp-search-row">
              <input
                id="destination"
                name="location"
                placeholder="Enter a city or destination"
                aria-label="City or destination"
              />
              <button type="submit">Find perks →</button>
            </div>
          </form>

          <div className="dp-hero-links">
            <Link href="/explore">Browse all perks →</Link>
            <Link href="/plan">Explore trip planning →</Link>
          </div>
        </div>
      </section>

      <section className="dp-section">
        <div className="dp-section-heading">
          <div>
            <span className="dp-kicker">DISCOVER YOUR BENEFITS</span>
            <h2>What are you looking for?</h2>
          </div>
          <Link href="/explore">View all categories →</Link>
        </div>

        <div className="dp-category-grid">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/explore?category=${encodeURIComponent(category.name)}`}
              className="dp-category-card"
            >
              <span className="dp-category-icon">{category.icon}</span>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span className="dp-card-arrow">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dp-section dp-destinations">
        <div className="dp-section-heading">
          <div>
            <span className="dp-kicker">EXPLORE BY LOCATION</span>
            <h2>Start somewhere amazing.</h2>
            <p>Browse the destinations currently featured on DutyPerks.</p>
          </div>
        </div>

        <div className="dp-destination-grid">
          {destinations.map((destination) => (
            <Link
              key={destination.name}
              href={destination.href}
              className="dp-destination-card"
            >
              <span className="dp-destination-tag">EXPLORE DESTINATION</span>
              <h3>{destination.name}</h3>
              <strong>{destination.state}</strong>
              <p>{destination.description}</p>
              <span className="dp-card-arrow">Discover perks →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dp-section">
        <div className="dp-feature-panel">
          <div>
            <span className="dp-kicker">TRAVEL SMARTER</span>
            <h2>Your next adventure starts here.</h2>
            <p>
              We&apos;re developing trip-planning tools to help military
              families find relevant benefits while exploring new places.
            </p>
            <Link href="/plan" className="dp-primary-link">
              Preview trip planning →
            </Link>
          </div>
          <div className="dp-feature-art" aria-hidden="true">
            ✈️
          </div>
        </div>
      </section>

      <section className="dp-section dp-community">
        <span className="dp-kicker">BUILT WITH THE MILITARY COMMUNITY</span>
        <h2>Help make DutyPerks better.</h2>
        <p>
          Know about a military discount we should investigate?
          Share your feedback while we develop our verified
          discount submission system.
        </p>
        <Link href="/feedback" className="dp-primary-link">
          Share your feedback →
        </Link>
      </section>
    </main>
  );
}
