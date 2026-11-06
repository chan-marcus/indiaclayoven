import "./ContyntCredit.css";

/**
 * "By CONTYNT" footer credit, linking to getcontynt.com. The logo and name take
 * the footer's own text color; on hover the logo's drop turns CONTYNT green.
 */
export function ContyntCredit() {
  return (
    <a className="ct-credit" href="https://getcontynt.com" target="_blank" rel="noopener" aria-label="Website by CONTYNT">
      <span>By</span>
      <span className="ct-credit-mark" aria-hidden="true" />
      <span className="ct-credit-name">CONTYNT</span>
    </a>
  );
}
