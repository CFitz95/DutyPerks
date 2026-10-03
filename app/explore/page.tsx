export default function Explore() {
  return (
    <main>
      <h1>Explore nearby</h1>
      <p>V1: location + eligibility + category filters will query verified benefits ordered by distance.</p>
      <form>
        <label>City or ZIP<br/><input name="location" placeholder="San Diego, CA"/></label><br/><br/>
        <label>Status<br/>
          <select name="status">
            <option>Active Duty</option><option>Reserve / Guard</option>
            <option>Veteran</option><option>Retired</option><option>Military Family</option>
          </select>
        </label><br/><br/>
        <label>Category<br/>
          <select name="category">
            <option>Everything</option><option>Food</option><option>Hotels</option>
            <option>Entertainment</option><option>Shopping</option><option>Automotive</option>
            <option>Fitness</option><option>Education</option><option>Financial</option>
          </select>
        </label>
      </form>
    </main>
  );
}
