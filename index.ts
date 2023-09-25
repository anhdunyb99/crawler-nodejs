import { crawlAll } from "./crawler-function/crawler_fuction_madou";
import {
  collectLinkFromNavBar,
  crawlAllFrom91Md,
  crawlDataFromSinglePage,
  crawlDataFromSingleStudio,
} from "./crawler-function/crawler_function_91md";
async function main() {
  /* await crawlAll(); */
  /* await crawlActorName(); */
  /* await collectLinkFromNavBar(); */
  await crawlAllFrom91Md();
}

main();
