import Link from "next/link";
import InstallButton from "./InstallButton";
export default function InstallPage() {
  return <main><p className="eyebrow">DutyPerks on your phone</p><h1>Your offers, one tap away.</h1>
    <p>Add DutyPerks to your home screen for quick access. You can use it without creating a customer account.</p>
    <InstallButton />
    <section className="card"><h2>iPhone or iPad</h2><ol>
      <li>Open this website in Safari.</li><li>Open the Share menu.</li><li>Choose Add to Home Screen. If shown, turn on Open as Web App.</li><li>Tap Add.</li>
    </ol><a href="https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios" target="_blank" rel="noopener noreferrer">Apple’s installation instructions</a></section>
    <section className="card"><h2>Android</h2><ol>
      <li>Open this website in Chrome.</li><li>Open the three-dot menu.</li><li>Choose Add to Home screen or Install app, then follow the prompts.</li>
    </ol><a href="https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid" target="_blank" rel="noopener noreferrer">Google’s installation instructions</a></section>
    <p>An internet connection is required to check offers and submit feedback. When offline, DutyPerks shows a reconnect message rather than old offers.</p>
    <Link className="button-link" href="/explore">Find an offer</Link>
  </main>;
}
