import {
  crawlActorName,
  crawlCodeFilm,
} from "./crawler-function/crawler-fuction";
async function main() {
  await crawlCodeFilm();
  /* await crawlActorName(); */
}

main();
