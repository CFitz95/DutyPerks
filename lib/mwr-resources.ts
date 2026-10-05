export const mwrResources = [
  {
    title: "NAS Whidbey Island MWR Tickets & Travel",
    location: "Oak Harbor, WA",
    area: "whidbey",
    url: "https://whidbey.navylifepnw.com/programs/5e144188-b642-4184-bde4-43fc6373469e",
    detail: "The Convergence Zone ticket office offers attraction tickets and travel resources for eligible MWR patrons. Check the official page for the current price list and purchase requirements.",
  },
  {
    title: "Naval Base San Diego MWR Tickets & Travel",
    location: "San Diego, CA",
    area: "san-diego",
    url: "https://sandiego.navylifesw.com/recreation/tickets-travel-itt",
    detail: "Find the official ticket price list and San Diego ticket-office locations. Confirm current prices, availability and patron eligibility with the office before purchasing.",
  },
] as const;

export function matchingMwrResources(location: string) {
  const value = location.trim().toLowerCase();
  if (!value) return mwrResources;
  return mwrResources.filter(resource => resource.area === "san-diego"
    ? /^(san diego(?:,? ca)?|921\d\d)$/.test(value)
    : /^(whidbey island(?:,? wa)?|(?:oak harbor|langley|coupeville|freeland|clinton|greenbank)(?:,? wa)?|98277|98278|98260|98239|98249|98236|98253)$/.test(value));
}
