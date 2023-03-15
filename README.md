# MSW (mock service worker)

[출처 : Dale](https://www.daleseo.com/mock-service-worker/)

## MSW란

서비스 워커를 사용해 네트워크 호출을 가로채는 API 모킹 라이브러리이다.

쉽게 말해, 브라우저에 기생해 마치 백엔드 API인 척 프론트의 요청에 가짜 데이터를 응답해 주는 것.

브라우저로부터 나가는 요청이나 들어오는 응답을 중간에서 감시하고 변조, 캐싱과 같은 작업들을 할 수 있다.

웹 개발에 있어 API 모킹의 수준을 한 단계 올려놓았다고 평가받음.

1. 백엔드 API 구현이 완료될 때까지 임시로 사용하기 위한 Mock API를 서비스 워커로 돌릴 수 있고,

2. 테스트 실행 시 실제 API 호출 대신 훨씬 빠르고 안정적인 Mock API를 구축하기 좋다.

## MSW의 특징

msw의 강점은 모킹이 네트워크 단에서 일어나기 때문에 프론트엔드 코드를 실제 백엔드 api와 통신하는 것과

크게 다르지 않게 작설할 수 있다는 것.

나중에 가짜 api를 실제 api로 대체하는 것이 쉽다는 뜻.

REST API 모킹과 GraphQL API 모킹을 모두 지원한다는 점도 매력적이다.

## 설치

```js
npm i -D msw
```

## 서비스 워커 코드 생성

msw는 브라우저에서 서비스 워커를 통해 작동하기 때문에 서비스 워커 등록을 위한 코드가 필요.

msw에서 CLI 도구를 제공한다.

```js
npx msw init public/ --save
```

## 요청 핸들러 작성

가짜 API를 구현하려면 요청이 들어왔을 때 임의의 응답을 해주는 `핸들러(handler)` 코드를 작성해야한다.

다르게 하면 안되는 건 아니지만,

모킹 관련 코드는 `mocks` 디렉토리에 두는것이 관례.

Rest api를 모킹할때는 msw 모듈의 rest 객체를 사용하고, Express.js의 코딩 패턴과 유사한 방식으로 핸들러를 구현한다.

할 일 목록을 조회하기 위한 `GET /todos`, 새로운 할 일을 추가하기 위한`POST /todos`.

```js
import { rest } from "msw";

const todos = ["먹기", "자기", "놀기"];

export const handlers = [
  // 할일 목록
  rest.get("/todos", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(todos));
  }),

  // 할일 추가
  rest.post("/todos", (req, res, ctx) => {
    todos.push(req.body);
    return res(ctx.status(201));
  })
];
```

## 서비스 워커 생성

msw 모듈에서 제공하는 `setupWorker()` 함수를 사용해 생성한다.

```js
import { setupWorker } from "msw";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

```

## 서비스 워커 삽입

서비스 워커를 구동하는 코드를 애플리케이션의 진입 시점에 삽입한다.

환경 변수를 체크해 개발환경일 때 구동하도록 해줬다.

```js
// index.js

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { worker } from "./mocks/worker";
if (process.env.NODE_ENV === "development") {
  worker.start();
}

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

```

## 서비스 워커 테스트

이제 애플리케이션을 run 하고 브라우저에서 열면 콘솔에 모킹이 활성화 되었다는 메시지가 출력됨.

```js
[MSW] Mocking enabled

```

이제 `fetch()` 함수를 사용해서 정말로 GET /todos에 요청을 보내면 가짜 응답이 오는지 확인해보자.

```js
// App.js

fetch("/todos")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## App.js에 todolist 작성

## 테스트 서버 작성

MSW는 개발에서 뿐만 아니라 테스트에서도 활용할 수 있다.

`msw/node` 모듈의 `setupServer()` 함수를 이용하면 간단하게 테스트용 API 서버를 만들 수 있는데,

 위에서 작성한 가짜 응답을 해주는 요청 핸들러를 그대로 재활용하면 된다.

## 테스트 서버 설정

테스트 실행 전에 가짜 API 서버를 올렸다가 테스트 실행 후에 내릴 수 있도록 Jest 설정을 해준다.

가장 상위 파일, `setupTests.js`에 다음 코드를 추가해주면 된다.

```js
// src/setupTests.js

import "@testing-library/jest-dom";
import { server } from "./mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

```

## 테스트 코드 작성

```js
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("renders todos", async () => {
  render(<App />);

  const listitems = await screen.findAllByRole("listitem");
  expect(listitems).toHaveLength(3);

  userEvent.type(screen.getByRole("textbox"), "공부하기");
  userEvent.click(screen.getByRole("button"));

  expect(await screen.findByText("공부하기")).toBeInTheDocument();
});
```

`npx jest --watchAll` 입력해 테스트
