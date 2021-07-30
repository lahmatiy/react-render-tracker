import rempl from "rempl";

export const publisher = rempl.createPublisher(
  "react-render-tracker",
  (settings, callback) => {
    const { origin } = new URL(import.meta.url);
    fetch(`${origin}/subscriber.js`)
      .then(res => res.text())
      .then(script => callback(null, "script", script));
  }
);
