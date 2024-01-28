import { fromEvent } from "rxjs";
import {
  merge, // if we use merge as operator, it should be imported from operators
  mergeMap,
  map,
  startWith,
  combineLatest,
  tap,
} from "rxjs";

const e_closeButton1 = document.querySelector(".close1");
const e_closeButton2 = document.querySelector(".close2");
const e_closeButton3 = document.querySelector(".close3");
const e_refreshButton = document.querySelector(".refresh");

const close1Click$ = fromEvent(e_closeButton1, "click");
const close2Click$ = fromEvent(e_closeButton2, "click");
const close3Click$ = fromEvent(e_closeButton3, "click");
const refreshClick$ = fromEvent(e_refreshButton, "click");

const request$ = refreshClick$.pipe(
  // we use startWith to also trigger on page load;
  // no need to imitate a real event object, we just need some value (it will be remapped later in map operator anyway)
  startWith(null),
  //  now we need to map each click to some url
  map(() => `https://api.github.com/users?since=${getRandomOffset()}`),
  tap(() => console.log("X"))
);

const response$ = request$.pipe(
  mergeMap((url) => fetch(url)),
  mergeMap((response) => response.json())
);

const suggestion1$ = createSuggestionStream(close1Click$);
const suggestion2$ = createSuggestionStream(close2Click$);
const suggestion3$ = createSuggestionStream(close3Click$);

suggestion1$.subscribe((suggestedUser) =>
  renderSuggestion(suggestedUser, ".suggestion1")
);
suggestion2$.subscribe((suggestedUser) =>
  renderSuggestion(suggestedUser, ".suggestion2")
);
suggestion3$.subscribe((suggestedUser) =>
  renderSuggestion(suggestedUser, ".suggestion3")
);

// т.к. у нас refresh-стрим разветвляется на три холодных пайпа,
// event listener для кнопки refresh будет добавлен 3 раза, например

function createSuggestionStream(closeClick$) {
  return closeClick$.pipe(
    startWith(null),
    combineLatest(response$, (_, usersList) => getRandomUser(usersList)),
    merge(refreshClick$.pipe(map(() => null)))
    // это нужно, чтобы сразу же очистить список при клике по Refresh,
    // а не дожидаться, пока реквест выполнится. когда он выполнится,
    //отрисовываем с новыми данными.
    // Разница хорошо видна при включенном троттлинге сети
  );
}

function getRandomOffset() {
  return Math.floor(Math.random() * 500);
}

function getRandomUser(usersList) {
  console.log(usersList);
  return usersList[Math.floor(Math.random() * usersList.length)];
}

function renderSuggestion(suggestedUser, selector) {
  const suggestion_el = document.querySelector(selector);

  if (suggestedUser === null) {
    suggestion_el.style.visibility = "hidden";
  } else {
    suggestion_el.style.visibility = "visible";

    const username_el = suggestion_el.querySelector(".username");
    username_el.href = suggestedUser.html_url;
    username_el.textContent = suggestedUser.login;

    const img_el = suggestion_el.querySelector("img");
    img_el.src = "";
    img_el.src = suggestedUser.avatar_url;
  }
}
