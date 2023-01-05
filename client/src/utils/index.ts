export const shortenAddress = (address: string) => (address ? `${address.slice(0, 10)}...${address.slice(address.length - 5)}` : "");
