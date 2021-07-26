import { getSubscriber } from "rempl";

console.log("subscriber will be here");
getSubscriber().subscribe(data => {
  document.body.innerHTML = data;
});
