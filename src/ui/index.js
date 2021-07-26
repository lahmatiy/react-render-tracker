import { getSubscriber } from "rempl";

getSubscriber().subscribe(data => {
  document.body.innerHTML = data;
});
