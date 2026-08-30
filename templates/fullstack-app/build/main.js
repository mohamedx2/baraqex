var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __glob = (map) => (path) => {
  var fn = map[path];
  if (fn)
    return fn();
  throw new Error("Module not found in bundle: " + path);
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/frontend-hamroun/dist/index.mjs
function batchUpdates(fn) {
  if (isBatching) {
    queue.push(fn);
    return;
  }
  isBatching = true;
  try {
    fn();
    while (queue.length > 0) {
      const nextFn = queue.shift();
      nextFn == null ? void 0 : nextFn();
    }
  } finally {
    isBatching = false;
  }
}
function setRenderCallback(callback, element, container) {
  globalRenderCallback = callback;
  globalContainer = container;
  currentElement = element;
}
function prepareRender() {
  currentRender++;
  stateIndices.set(currentRender, 0);
  return currentRender;
}
function finishRender() {
  if (isServer) {
    serverStates.delete(currentRender);
  }
  currentRender = 0;
}
function useState(initial) {
  if (!currentRender) {
    throw new Error("useState must be called within a render");
  }
  if (isServer) {
    if (!serverStates.has(currentRender)) {
      serverStates.set(currentRender, /* @__PURE__ */ new Map());
    }
    const componentState = serverStates.get(currentRender);
    const index2 = stateIndices.get(currentRender) || 0;
    if (!componentState.has(index2)) {
      componentState.set(index2, initial);
    }
    const state2 = componentState.get(index2);
    const setState2 = (newValue) => {
    };
    stateIndices.set(currentRender, index2 + 1);
    return [state2, setState2];
  }
  if (!states.has(currentRender)) {
    states.set(currentRender, []);
  }
  const componentStates = states.get(currentRender);
  const index = stateIndices.get(currentRender);
  if (index >= componentStates.length) {
    componentStates.push(initial);
  }
  const state = componentStates[index];
  const setState = (newValue) => {
    const nextValue = typeof newValue === "function" ? newValue(componentStates[index]) : newValue;
    if (componentStates[index] === nextValue)
      return;
    componentStates[index] = nextValue;
    if (isBatching) {
      batchUpdates(() => rerender(currentRender));
    } else {
      rerender(currentRender);
    }
  };
  stateIndices.set(currentRender, index + 1);
  return [state, setState];
}
function useEffect(callback, deps) {
  if (!currentRender)
    throw new Error("useEffect must be called within a render");
  const effectIndex = stateIndices.get(currentRender);
  if (!effects.has(currentRender)) {
    effects.set(currentRender, []);
  }
  const componentEffects = effects.get(currentRender);
  const prevEffect = componentEffects[effectIndex];
  if (!prevEffect || !deps || !prevEffect.deps || deps.some((dep, i) => dep !== prevEffect.deps[i])) {
    if (prevEffect == null ? void 0 : prevEffect.cleanup) {
      prevEffect.cleanup();
    }
    queueMicrotask(() => {
      const cleanup = callback() || void 0;
      componentEffects[effectIndex] = { cleanup, deps };
    });
  }
  stateIndices.set(currentRender, effectIndex + 1);
}
function useMemo(factory, deps) {
  if (!currentRender)
    throw new Error("useMemo must be called within a render");
  const memoIndex = stateIndices.get(currentRender);
  if (!memos.has(currentRender)) {
    memos.set(currentRender, []);
  }
  const componentMemos = memos.get(currentRender);
  const prevMemo = componentMemos[memoIndex];
  if (!prevMemo || deps && deps.some((dep, i) => !Object.is(dep, prevMemo.deps[i]))) {
    const value = factory();
    componentMemos[memoIndex] = { value, deps };
    stateIndices.set(currentRender, memoIndex + 1);
    return value;
  }
  stateIndices.set(currentRender, memoIndex + 1);
  return prevMemo.value;
}
async function rerender(rendererId) {
  try {
    const componentEffects = effects.get(rendererId);
    if (componentEffects) {
      componentEffects.forEach((effect) => {
        if (effect.cleanup)
          effect.cleanup();
      });
      effects.set(rendererId, []);
    }
    if (globalRenderCallback && globalContainer && currentElement) {
      await globalRenderCallback(currentElement, globalContainer);
    }
  } catch (error) {
    console.error("Error during rerender:", error);
  }
}
function useErrorBoundary() {
  const [error, setError] = useState(null);
  return [error, () => setError(null)];
}
function jsx(type, props) {
  console.log("JSX Transform:", { type, props });
  const processedProps = { ...props };
  if (arguments.length > 2) {
    processedProps.children = Array.prototype.slice.call(arguments, 2);
  }
  return { type, props: processedProps };
}
async function createElement(vnode) {
  var _a;
  console.log("Creating element from:", vnode);
  if (vnode == null) {
    return document.createTextNode("");
  }
  if (typeof vnode === "boolean") {
    return document.createTextNode("");
  }
  if (typeof vnode === "number" || typeof vnode === "string") {
    return document.createTextNode(String(vnode));
  }
  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    for (const child of vnode) {
      const node = await createElement(child);
      fragment.appendChild(node);
    }
    return fragment;
  }
  if ("type" in vnode && vnode.props !== void 0) {
    const { type, props } = vnode;
    if (typeof type === "function") {
      try {
        const result = await type(props || {});
        const node = await createElement(result);
        if (node instanceof Element) {
          node.setAttribute("data-component-id", type.name || type.toString());
        }
        return node;
      } catch (error) {
        console.error("Error rendering component:", error);
        return document.createTextNode("");
      }
    }
    const element = document.createElement(type);
    for (const [key, value] of Object.entries(props || {})) {
      if (key === "children")
        continue;
      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.toLowerCase().slice(2);
        const existingHandler = (_a = element.__events) == null ? void 0 : _a[eventName];
        if (existingHandler) {
          element.removeEventListener(eventName, existingHandler);
        }
        element.addEventListener(eventName, value);
        if (!element.__events) {
          element.__events = {};
        }
        element.__events[eventName] = value;
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (key === "className") {
        element.setAttribute("class", String(value));
      } else if (key !== "key" && key !== "ref") {
        element.setAttribute(key, String(value));
      }
    }
    const children = props == null ? void 0 : props.children;
    if (children != null) {
      const childArray = Array.isArray(children) ? children.flat() : [children];
      for (const child of childArray) {
        const childNode = await createElement(child);
        element.appendChild(childNode);
      }
    }
    return element;
  }
  return document.createTextNode(String(vnode));
}
async function hydrate(element, container) {
  isHydrating = true;
  try {
    await render(element, container);
  } finally {
    isHydrating = false;
  }
}
async function render(element, container) {
  console.log("Rendering to:", container.id);
  batchUpdates(async () => {
    const rendererId = prepareRender();
    try {
      setRenderCallback(render, element, container);
      const domNode = await createElement(element);
      if (!isHydrating) {
        container.innerHTML = "";
      }
      container.appendChild(domNode);
    } finally {
      finishRender();
    }
  });
}
var isBatching, queue, currentRender, states, stateIndices, effects, memos, globalRenderCallback, globalContainer, currentElement, isServer, serverStates, isHydrating;
var init_dist = __esm({
  "node_modules/frontend-hamroun/dist/index.mjs"() {
    isBatching = false;
    queue = [];
    currentRender = 0;
    states = /* @__PURE__ */ new Map();
    stateIndices = /* @__PURE__ */ new Map();
    effects = /* @__PURE__ */ new Map();
    memos = /* @__PURE__ */ new Map();
    globalRenderCallback = null;
    globalContainer = null;
    currentElement = null;
    isServer = typeof window === "undefined";
    serverStates = /* @__PURE__ */ new Map();
    isHydrating = false;
  }
});

// src/pages/404.tsx
var __exports = {};
__export(__exports, {
  default: () => NotFound
});
function NotFound({ initialState: initialState2 }) {
  return /* @__PURE__ */ jsx("div", { className: "not-found-container max-w-4xl mx-auto p-6" }, /* @__PURE__ */ jsx("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-8 shadow-sm" }, /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-700 mb-4" }, "Page Not Found"), /* @__PURE__ */ jsx("p", { className: "text-lg text-gray-600 mb-4" }, "The page you are looking for does not exist or has been moved."), /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6" }, "Path: ", /* @__PURE__ */ jsx("code", { className: "bg-gray-100 px-2 py-1 rounded" }, initialState2?.route || "unknown")), /* @__PURE__ */ jsx("div", { className: "mt-6" }, /* @__PURE__ */ jsx(
    "a",
    {
      href: "/",
      className: "inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    },
    "Back to Home"
  ))));
}
var init__ = __esm({
  "src/pages/404.tsx"() {
    "use strict";
    init_dist();
  }
});

// src/pages/[id].tsx
var id_exports = {};
var init_id = __esm({
  "src/pages/[id].tsx"() {
    "use strict";
  }
});

// src/components/Layout.tsx
function Layout({ children, title = "Frontend Hamroun App" }) {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex flex-col bg-gray-50" }, /* @__PURE__ */ jsx("header", { className: "bg-blue-600 text-white" }, /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-4 flex justify-between items-center" }, /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold" }, /* @__PURE__ */ jsx("a", { href: "/", className: "hover:text-blue-100" }, title)), /* @__PURE__ */ jsx("nav", null, /* @__PURE__ */ jsx("ul", { className: "flex space-x-6" }, /* @__PURE__ */ jsx("li", null, /* @__PURE__ */ jsx("a", { href: "/", className: "hover:text-blue-100" }, "Home")), /* @__PURE__ */ jsx("li", null, /* @__PURE__ */ jsx("a", { href: "/about", className: "hover:text-blue-100" }, "About")))))), /* @__PURE__ */ jsx("main", { className: "flex-grow container mx-auto px-4 py-8" }, children), /* @__PURE__ */ jsx("footer", { className: "bg-gray-800 text-white" }, /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-6" }, /* @__PURE__ */ jsx("p", { className: "text-center text-gray-400" }, "\xA9 ", (/* @__PURE__ */ new Date()).getFullYear(), " Frontend Hamroun App. All rights reserved."))));
}
var init_Layout = __esm({
  "src/components/Layout.tsx"() {
    "use strict";
    init_dist();
  }
});

// src/pages/_app.tsx
var app_exports = {};
__export(app_exports, {
  default: () => App
});
function App({ Component, pageProps, initialState: initialState2 }) {
  return /* @__PURE__ */ jsx(Layout, null, /* @__PURE__ */ jsx(Component, { ...pageProps, initialState: initialState2 }));
}
var init_app = __esm({
  "src/pages/_app.tsx"() {
    "use strict";
    init_dist();
    init_Layout();
  }
});

// src/pages/_document.tsx
var document_exports = {};
__export(document_exports, {
  default: () => Document
});
function Document({
  title = "Frontend Hamroun App",
  headContent,
  bodyContent,
  scripts
}) {
  return /* @__PURE__ */ jsx("html", { lang: "en" }, /* @__PURE__ */ jsx("head", null, /* @__PURE__ */ jsx("meta", { charSet: "UTF-8" }), /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }), /* @__PURE__ */ jsx("title", null, title), /* @__PURE__ */ jsx("link", { rel: "stylesheet", href: "/styles.css" }), headContent), /* @__PURE__ */ jsx("body", null, /* @__PURE__ */ jsx("div", { id: "root" }, bodyContent), /* @__PURE__ */ jsx("script", { src: "/build/main.js", type: "module" }), scripts));
}
var init_document = __esm({
  "src/pages/_document.tsx"() {
    "use strict";
    init_dist();
  }
});

// src/pages/_error.tsx
var error_exports = {};
__export(error_exports, {
  default: () => ErrorPage
});
function ErrorPage({ initialState: initialState2 }) {
  const { error } = initialState2 || {};
  const [showDetails, setShowDetails] = useState(false);
  const isDev = true;
  return /* @__PURE__ */ jsx("div", { className: "error-page-container max-w-4xl mx-auto p-6" }, /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-8 shadow-sm" }, /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-red-700 mb-4" }, "Something went wrong"), /* @__PURE__ */ jsx("p", { className: "text-lg text-red-600 mb-4" }, error?.message || "An unexpected error occurred"), isDev && error?.stack && /* @__PURE__ */ jsx("div", { className: "mt-6" }, /* @__PURE__ */ jsx(
    "button",
    {
      className: "text-blue-600 underline mb-2",
      onClick: () => setShowDetails(!showDetails)
    },
    showDetails ? "Hide" : "Show",
    " technical details"
  ), showDetails && /* @__PURE__ */ jsx("pre", { className: "bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96 text-gray-800" }, error.stack)), /* @__PURE__ */ jsx("div", { className: "mt-6" }, /* @__PURE__ */ jsx(
    "a",
    {
      href: "/",
      className: "inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    },
    "Back to Home"
  ))));
}
var init_error = __esm({
  "src/pages/_error.tsx"() {
    "use strict";
    init_dist();
  }
});

// src/pages/about.tsx
var about_exports = {};
__export(about_exports, {
  default: () => AboutPage,
  getServerSideProps: () => getServerSideProps
});
function AboutPage({ initialState: initialState2 }) {
  return /* @__PURE__ */ jsx(Layout, { title: "About - Frontend Hamroun" }, /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto" }, /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-blue-600 mb-6" }, "About Frontend Hamroun"), /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-8 mb-8" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4" }, "What is Frontend Hamroun?"), /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4" }, "Frontend Hamroun is a lightweight JavaScript framework for building modern web applications. It provides a familiar component-based architecture with hooks, JSX support, and server-side rendering capabilities."), /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4" }, "This framework is designed to be simple yet powerful, offering the essential features needed for web application development without the complexity of larger frameworks."), /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-700 mt-6 mb-2" }, "Key Features:"), /* @__PURE__ */ jsx("ul", { className: "list-disc pl-6 text-gray-600 space-y-2" }, /* @__PURE__ */ jsx("li", null, "Component-based architecture"), /* @__PURE__ */ jsx("li", null, "JSX support"), /* @__PURE__ */ jsx("li", null, "Hooks for state and effects"), /* @__PURE__ */ jsx("li", null, "Server-side rendering"), /* @__PURE__ */ jsx("li", null, "Minimal API surface"), /* @__PURE__ */ jsx("li", null, "File-based routing"), /* @__PURE__ */ jsx("li", null, "Built-in API routes"))), /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-8" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4" }, "Getting Started"), /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4" }, "This application was created using the Frontend Hamroun fullstack template, which provides a complete setup for building applications with server-side rendering, API routes, and client-side navigation."), /* @__PURE__ */ jsx("div", { className: "bg-gray-50 p-4 rounded-md mt-4" }, /* @__PURE__ */ jsx("h3", { className: "text-md font-medium text-gray-700 mb-2" }, "Quick Start:"), /* @__PURE__ */ jsx("pre", { className: "bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto" }, /* @__PURE__ */ jsx("code", null, `# Create a new application
npx frontend-hamroun create my-app

# Change directory
cd my-app

# Start the development server
npm run dev`))))));
}
async function getServerSideProps() {
  return {
    props: {
      pageTitle: "About Frontend Hamroun",
      description: "Learn more about the Frontend Hamroun framework"
    }
  };
}
var init_about = __esm({
  "src/pages/about.tsx"() {
    "use strict";
    init_dist();
    init_Layout();
  }
});

// src/pages/about/index.tsx
var about_exports2 = {};
__export(about_exports2, {
  default: () => about_default
});
var AboutPage2, about_default;
var init_about2 = __esm({
  "src/pages/about/index.tsx"() {
    "use strict";
    init_dist();
    init_Layout();
    AboutPage2 = ({ initialState: initialState2 }) => {
      return /* @__PURE__ */ jsx(Layout, { title: "About This App" }, /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden" }, /* @__PURE__ */ jsx("div", { className: "p-8" }, /* @__PURE__ */ jsx("p", { className: "text-lg text-gray-700 mb-6" }, "This is a frontend application built with Frontend Hamroun framework and styled with Tailwind CSS."), /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-8" }, "It features server-side rendering, client-side navigation, and websocket-based live reloading during development."), /* @__PURE__ */ jsx("div", { className: "bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4" }, "Key Features"), /* @__PURE__ */ jsx("ul", { className: "space-y-2 text-gray-700" }, /* @__PURE__ */ jsx("li", { className: "flex items-center" }, /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-500 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })), "Server-side rendering"), /* @__PURE__ */ jsx("li", { className: "flex items-center" }, /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-500 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })), "Client-side navigation"), /* @__PURE__ */ jsx("li", { className: "flex items-center" }, /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-500 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })), "Component-based architecture"), /* @__PURE__ */ jsx("li", { className: "flex items-center" }, /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-500 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })), "Integrated API backend"), /* @__PURE__ */ jsx("li", { className: "flex items-center" }, /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-500 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })), "Live reload during development"), /* @__PURE__ */ jsx("li", { className: "flex items-center" }, /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-green-500 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })), "Tailwind CSS for styling"))), /* @__PURE__ */ jsx("a", { href: "/", className: "inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors" }, "Back to Home"))));
    };
    about_default = AboutPage2;
  }
});

// src/components/UserList.tsx
function UserList({ users }) {
  if (!users || users.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "empty-state p-4 text-center bg-gray-50 rounded" }, /* @__PURE__ */ jsx("p", { className: "text-gray-500" }, "No users available"));
  }
  return /* @__PURE__ */ jsx("div", { className: "user-list" }, /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100" }, users.map((user) => /* @__PURE__ */ jsx("li", { key: user.id, className: "py-3" }, /* @__PURE__ */ jsx("div", { className: "flex justify-between" }, /* @__PURE__ */ jsx("div", null, /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900" }, user.name), /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500" }, user.email)), /* @__PURE__ */ jsx(
    "a",
    {
      href: `/users/${user.id}`,
      className: "text-blue-600 hover:underline text-sm self-center"
    },
    "View Profile"
  ))))));
}
var init_UserList = __esm({
  "src/components/UserList.tsx"() {
    "use strict";
    init_dist();
  }
});

// src/components/StateDemo.tsx
function StateDemo() {
  const [state, setState] = useState({
    count: 0,
    lastUpdated: null,
    history: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isSSR = typeof window === "undefined";
  const stats = useMemo(() => {
    if (isSSR || !state || !state.history || state.history.length === 0) {
      return { avg: 0, max: 0, min: 0 };
    }
    try {
      const sum = state.history.reduce((a, b) => a + b, 0);
      return {
        avg: parseFloat((sum / state.history.length).toFixed(1)),
        max: Math.max(...state.history),
        min: Math.min(...state.history)
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return { avg: 0, max: 0, min: 0 };
    }
  }, [state?.history]);
  const increment = () => {
    if (isSSR)
      return;
    setIsLoading(true);
    setTimeout(() => {
      setState((prevState) => ({
        count: prevState.count + 1,
        lastUpdated: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
        history: [...prevState.history || [], prevState.count + 1]
      }));
      setIsLoading(false);
    }, 300);
  };
  const decrement = () => {
    if (isSSR)
      return;
    setIsLoading(true);
    setTimeout(() => {
      setState((prevState) => ({
        count: Math.max(0, prevState.count - 1),
        lastUpdated: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
        history: prevState.count > 0 ? [...prevState.history || [], prevState.count - 1] : prevState.history || []
      }));
      setIsLoading(false);
    }, 300);
  };
  const reset = () => {
    if (isSSR)
      return;
    setState({
      count: 0,
      lastUpdated: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      history: []
    });
  };
  const toggleHistory = () => {
    if (isSSR)
      return;
    setShowHistory((prev) => !prev);
  };
  if (isSSR) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-6 mb-8" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4" }, "State Management Demo"), /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg" }, "-"), /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold mx-4" }, "0"), /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-blue-600 text-white rounded-lg" }, "+")), /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500" }, "Interactive counter (client-side only)"));
  }
  return /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-6 mb-8" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4" }, "State Management Demo"), /* @__PURE__ */ jsx("div", { className: "mb-6" }, /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ jsx(
    "button",
    {
      onClick: decrement,
      className: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50",
      disabled: state.count === 0 || isLoading
    },
    isLoading ? "..." : "-"
  ), /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold mx-4" }, state.count), /* @__PURE__ */ jsx(
    "button",
    {
      onClick: increment,
      className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50",
      disabled: isLoading
    },
    isLoading ? "..." : "+"
  )), /* @__PURE__ */ jsx(
    "button",
    {
      onClick: reset,
      className: "text-sm text-gray-600 hover:text-red-600",
      disabled: state.count === 0 && (!state.history || state.history.length === 0)
    },
    "Reset Counter"
  )), state.lastUpdated && /* @__PURE__ */ jsx("div", { className: "mb-4" }, /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500" }, "Last updated: ", state.lastUpdated)), state.history && state.history.length > 0 && /* @__PURE__ */ jsx("div", { className: "border-t pt-4 mt-4" }, /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ jsx("h3", { className: "text-md font-medium text-gray-700" }, "Statistics"), /* @__PURE__ */ jsx(
    "button",
    {
      onClick: toggleHistory,
      className: "text-sm text-blue-600 hover:underline"
    },
    showHistory ? "Hide History" : "Show History"
  )), /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2 mb-3" }, /* @__PURE__ */ jsx("div", { className: "bg-blue-50 p-2 rounded text-center" }, /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500" }, "Average"), /* @__PURE__ */ jsx("div", { className: "font-bold" }, stats.avg)), /* @__PURE__ */ jsx("div", { className: "bg-green-50 p-2 rounded text-center" }, /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500" }, "Maximum"), /* @__PURE__ */ jsx("div", { className: "font-bold" }, stats.max)), /* @__PURE__ */ jsx("div", { className: "bg-red-50 p-2 rounded text-center" }, /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500" }, "Minimum"), /* @__PURE__ */ jsx("div", { className: "font-bold" }, stats.min))), showHistory && /* @__PURE__ */ jsx("div", { className: "mt-3" }, /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-600 mb-1" }, "History (", state.history.length, " events)"), /* @__PURE__ */ jsx("div", { className: "bg-gray-50 p-2 rounded max-h-24 overflow-y-auto text-xs" }, state.history.map((value, index) => /* @__PURE__ */ jsx(
    "span",
    {
      key: index,
      className: "inline-block bg-gray-200 rounded px-2 py-1 m-1"
    },
    value
  ))))));
}
var init_StateDemo = __esm({
  "src/components/StateDemo.tsx"() {
    "use strict";
    init_dist();
  }
});

// src/components/ErrorBoundary.tsx
function ErrorBoundary({ children, fallback }) {
  const [error, resetError] = useErrorBoundary();
  if (error) {
    if (fallback) {
      return fallback(error, resetError);
    }
    return /* @__PURE__ */ jsx("div", { className: "error-boundary p-4 border border-red-500 rounded bg-red-50" }, /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-red-800 mb-2" }, "Something went wrong"), /* @__PURE__ */ jsx("p", { className: "text-red-600 mb-2" }, error.message), /* @__PURE__ */ jsx(
      "button",
      {
        onClick: resetError,
        className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      },
      "Try again"
    ), /* @__PURE__ */ jsx("pre", { className: "mt-3 text-xs overflow-auto p-2 bg-gray-100" }, error.stack));
  }
  return children;
}
var init_ErrorBoundary = __esm({
  "src/components/ErrorBoundary.tsx"() {
    "use strict";
    init_dist();
  }
});

// src/data/api.ts
var sampleUsers, samplePosts, delay, UserApi;
var init_api = __esm({
  "src/data/api.ts"() {
    "use strict";
    init_dist();
    sampleUsers = [
      { id: 1, name: "User 1", email: "user1@example.com" },
      { id: 2, name: "User 2", email: "user2@example.com" },
      { id: 3, name: "User 3", email: "user3@example.com" }
    ];
    samplePosts = [
      { id: 1, title: "Post 1", content: "Content for post 1", authorId: 1 },
      { id: 2, title: "Post 2", content: "Content for post 2", authorId: 2 },
      { id: 3, title: "Post 3", content: "Content for post 3", authorId: 1 }
    ];
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    UserApi = {
      // Get all users
      async getAll() {
        try {
          await delay(300);
          return [...sampleUsers];
        } catch (error) {
          console.error("Error fetching users:", error);
          return [];
        }
      },
      // Get user by ID
      async getById(id) {
        try {
          const userId = typeof id === "string" ? parseInt(id, 10) : id;
          await delay(200);
          const user = sampleUsers.find((u) => u.id === userId);
          if (!user)
            throw new Error("User not found");
          return { ...user };
        } catch (error) {
          console.error(`Error fetching user ${id}:`, error);
          return null;
        }
      },
      // Get posts (all or by author)
      async getPosts(authorId) {
        try {
          const userId = authorId ? typeof authorId === "string" ? parseInt(authorId, 10) : authorId : void 0;
          await delay(400);
          const posts = userId ? samplePosts.filter((p) => p.authorId === userId) : samplePosts;
          return [...posts];
        } catch (error) {
          console.error("Error fetching posts:", error);
          return [];
        }
      }
    };
  }
});

// src/pages/index.tsx
var pages_exports = {};
__export(pages_exports, {
  default: () => HomePage,
  getServerSideProps: () => getServerSideProps2
});
function HomePage({ users, posts, initialState: initialState2 }) {
  const [state, setState] = useState(initialState2 || {});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  useEffect(() => {
    if (refreshTrigger === 0)
      return;
    async function fetchData() {
      try {
        const [users2, posts2] = await Promise.all([
          UserApi.getAll(),
          UserApi.getPosts()
        ]);
        batchUpdates(() => {
          setState((prev) => ({
            ...prev,
            data: {
              ...prev.data,
              users: users2,
              posts: posts2
            },
            lastUpdate: (/* @__PURE__ */ new Date()).toISOString()
          }));
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, [refreshTrigger]);
  const handleRefresh = () => {
    setRefreshTrigger((t) => t + 1);
  };
  return /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto py-8" }, /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-blue-600 mb-6" }, "Welcome to your Next-style Frontend Hamroun application!"), /* @__PURE__ */ jsx("div", { className: "mb-8" }, /* @__PURE__ */ jsx(
    "button",
    {
      className: "mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",
      onClick: handleRefresh
    },
    "Refresh Data"
  ), /* @__PURE__ */ jsx("div", { className: "bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6" }, /* @__PURE__ */ jsx("p", { className: "text-blue-700" }, "Last updated: ", state.lastUpdate || "Never"))), /* @__PURE__ */ jsx(ErrorBoundary, null, /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-6 mb-8" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4" }, "User List"), /* @__PURE__ */ jsx(UserList, { users: users || state.data?.users || [] }))), /* @__PURE__ */ jsx(ErrorBoundary, null, /* @__PURE__ */ jsx(StateDemo, null)), /* @__PURE__ */ jsx("div", { className: "bg-gray-50 rounded-lg p-6 border border-gray-200 mt-8" }, /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-700 mb-3" }, "Application State"), /* @__PURE__ */ jsx("pre", { className: "overflow-auto p-4 bg-gray-100 rounded-md text-sm text-gray-800" }, JSON.stringify({ users, posts, ...state }, null, 2))));
}
async function getServerSideProps2() {
  try {
    const users = await UserApi.getAll();
    const posts = await UserApi.getPosts();
    return {
      props: {
        users,
        posts
      }
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return {
      props: {
        users: [],
        posts: []
      }
    };
  }
}
var init_pages = __esm({
  "src/pages/index.tsx"() {
    "use strict";
    init_dist();
    init_UserList();
    init_StateDemo();
    init_ErrorBoundary();
    init_api();
  }
});

// src/pages/users.tsx
var users_exports = {};
__export(users_exports, {
  default: () => users_default
});
var UsersPage, users_default;
var init_users = __esm({
  "src/pages/users.tsx"() {
    "use strict";
    init_dist();
    init_Layout();
    init_api();
    UsersPage = ({ initialState: initialState2 }) => {
      const users = initialState2.data?.users || [];
      return /* @__PURE__ */ jsx(Layout, { title: "User Management" }, /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto" }, /* @__PURE__ */ jsx("div", { className: "bg-blue-50 p-6 rounded-lg mb-8 border border-blue-100" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-blue-800 mb-2" }, "Data Fetching Demo"), /* @__PURE__ */ jsx("p", { className: "text-blue-700" }, "This page demonstrates dynamic data fetching with the Users API.")), /* @__PURE__ */ jsx("div", { className: "bg-white shadow-md rounded-lg overflow-hidden" }, /* @__PURE__ */ jsx("div", { className: "px-6 py-4 border-b border-gray-200" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800" }, "User List")), users.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-gray-500" }, /* @__PURE__ */ jsx("p", null, "No users found.")) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto" }, /* @__PURE__ */ jsx("table", { className: "w-full" }, /* @__PURE__ */ jsx("thead", null, /* @__PURE__ */ jsx("tr", { className: "bg-gray-50" }, /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider border-b" }, "ID"), /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider border-b" }, "Name"), /* @__PURE__ */ jsx("th", { className: "text-left py-3 px-6 font-medium text-gray-600 text-sm uppercase tracking-wider border-b" }, "Email"))), /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200" }, users.map((user) => /* @__PURE__ */ jsx("tr", { key: user.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ jsx("td", { className: "py-4 px-6 text-sm text-gray-900" }, user.id), /* @__PURE__ */ jsx("td", { className: "py-4 px-6 text-sm font-medium text-gray-900" }, user.name), /* @__PURE__ */ jsx("td", { className: "py-4 px-6 text-sm text-gray-500" }, user.email)))))))));
    };
    UsersPage.getInitialData = async () => {
      return {
        users: await UserApi.getAll()
      };
    };
    users_default = UsersPage;
  }
});

// src/pages/users/[id].tsx
var id_exports2 = {};
__export(id_exports2, {
  default: () => UserDetail,
  getServerSideProps: () => getServerSideProps3
});
function UserDetail({ user, posts, initialState: initialState2 }) {
  const [userData, setUserData] = useState(user);
  const [userPosts, setUserPosts] = useState(posts || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { id } = initialState2?.params || {};
  useEffect(() => {
    if (!userData && id) {
      setLoading(true);
      Promise.all([
        UserApi.getById(id),
        UserApi.getPosts(id)
      ]).then(([userData2, postsData]) => {
        setUserData(userData2);
        setUserPosts(postsData);
        setLoading(false);
      }).catch((err) => {
        console.error("Error fetching user data:", err);
        setError(err.message || "Failed to load user data");
        setLoading(false);
      });
    }
  }, [userData, id]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto p-4" }, /* @__PURE__ */ jsx("div", { className: "animate-pulse rounded-md bg-gray-100 p-8" }, /* @__PURE__ */ jsx("div", { className: "h-8 bg-gray-200 rounded w-1/4 mb-4" }), /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-1/2 mb-2" }), /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-4" }), /* @__PURE__ */ jsx("div", { className: "h-40 bg-gray-200 rounded mb-4" })));
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto p-4" }, /* @__PURE__ */ jsx("div", { className: "rounded-md bg-red-50 p-4 border border-red-200" }, /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-red-700" }, "Error Loading User"), /* @__PURE__ */ jsx("p", { className: "text-red-600" }, error)));
  }
  if (!userData) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto p-4" }, /* @__PURE__ */ jsx("div", { className: "rounded-md bg-yellow-50 p-4 border border-yellow-200" }, /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-yellow-700" }, "User Not Found"), /* @__PURE__ */ jsx("p", { className: "text-yellow-600" }, "Could not find user with ID: ", id), /* @__PURE__ */ jsx("a", { href: "/users", className: "text-blue-600 hover:underline mt-2 block" }, "Back to Users List")));
  }
  return /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto p-4" }, /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-6 mb-6" }, /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-800 mb-4" }, userData.name), /* @__PURE__ */ jsx("div", { className: "user-info mb-6" }, /* @__PURE__ */ jsx("p", { className: "text-gray-600" }, /* @__PURE__ */ jsx("span", { className: "font-bold" }, "ID:"), " ", userData.id), /* @__PURE__ */ jsx("p", { className: "text-gray-600" }, /* @__PURE__ */ jsx("span", { className: "font-bold" }, "Email:"), " ", userData.email)), /* @__PURE__ */ jsx("a", { href: "/users", className: "text-blue-600 hover:underline" }, "Back to Users List")), userPosts && userPosts.length > 0 ? /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-6" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-gray-800 mb-4" }, "Posts by ", userData.name), /* @__PURE__ */ jsx("div", { className: "space-y-4" }, userPosts.map((post) => /* @__PURE__ */ jsx("div", { key: post.id, className: "border-b pb-4" }, /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold" }, post.title), /* @__PURE__ */ jsx("p", { className: "text-gray-600" }, post.content))))) : /* @__PURE__ */ jsx("div", { className: "bg-white shadow-lg rounded-lg p-6" }, /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-gray-800 mb-4" }, "Posts by ", userData.name), /* @__PURE__ */ jsx("p", { className: "text-gray-500 italic" }, "No posts found for this user.")));
}
async function getServerSideProps3({ params }) {
  try {
    const userId = params.id;
    const [user, posts] = await Promise.all([
      UserApi.getById(parseInt(userId)),
      UserApi.getPosts(parseInt(userId))
    ]);
    if (!user) {
      return {
        notFound: true
      };
    }
    return {
      props: {
        user,
        posts
      }
    };
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return {
      props: {
        error: {
          message: error.message,
          status: error.status || 500
        },
        user: null,
        posts: []
      }
    };
  }
}
var init_id2 = __esm({
  "src/pages/users/[id].tsx"() {
    "use strict";
    init_dist();
    init_api();
  }
});

// src/pages/wasm-demo.tsx
var wasm_demo_exports = {};
var init_wasm_demo = __esm({
  "src/pages/wasm-demo.tsx"() {
    "use strict";
  }
});

// src/main.tsx
init_dist();

// import("./pages/**/*.tsx") in src/main.tsx
var globImport_pages_tsx = __glob({
  "./pages/404.tsx": () => Promise.resolve().then(() => (init__(), __exports)),
  "./pages/[id].tsx": () => Promise.resolve().then(() => (init_id(), id_exports)),
  "./pages/_app.tsx": () => Promise.resolve().then(() => (init_app(), app_exports)),
  "./pages/_document.tsx": () => Promise.resolve().then(() => (init_document(), document_exports)),
  "./pages/_error.tsx": () => Promise.resolve().then(() => (init_error(), error_exports)),
  "./pages/about.tsx": () => Promise.resolve().then(() => (init_about(), about_exports)),
  "./pages/about/index.tsx": () => Promise.resolve().then(() => (init_about2(), about_exports2)),
  "./pages/index.tsx": () => Promise.resolve().then(() => (init_pages(), pages_exports)),
  "./pages/users.tsx": () => Promise.resolve().then(() => (init_users(), users_exports)),
  "./pages/users/[id].tsx": () => Promise.resolve().then(() => (init_id2(), id_exports2)),
  "./pages/wasm-demo.tsx": () => Promise.resolve().then(() => (init_wasm_demo(), wasm_demo_exports))
});

// import("./pages/**/*/index.tsx") in src/main.tsx
var globImport_pages_index_tsx = __glob({
  "./pages/about/index.tsx": () => Promise.resolve().then(() => (init_about2(), about_exports2))
});

// src/main.tsx
var initialState = window.__INITIAL_STATE__ || {
  route: window.location.pathname,
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  serverRendered: false,
  data: {
    users: null,
    posts: null
  }
};
console.log("[Client] Initial state:", initialState);
var isHydrating2 = document.getElementById("root")?.innerHTML.trim() !== "";
async function handleRouteChange(path, isPushState = true) {
  try {
    console.log(`[Router] Navigating to: ${path}`);
    if (isPushState) {
      window.history.pushState(null, "", path);
    }
    const normalizedPath = path === "/" ? "index" : path.replace(/^\//, "");
    let Page;
    try {
      const module = await globImport_pages_tsx(`./pages/${normalizedPath}.tsx`);
      Page = module.default;
    } catch (error) {
      console.warn(`[Router] Could not load page for ${path}, trying index file`);
      try {
        const module = await globImport_pages_index_tsx(`./pages/${normalizedPath}/index.tsx`);
        Page = module.default;
      } catch (innerError) {
        console.error(`[Router] Failed to load page component for ${path}`);
        try {
          const notFoundModule = await Promise.resolve().then(() => (init__(), __exports));
          Page = notFoundModule.default;
        } catch (notFoundError) {
          const rootElement2 = document.getElementById("root");
          if (rootElement2) {
            render(
              /* @__PURE__ */ jsx("div", { style: { padding: "20px", maxWidth: "800px", margin: "0 auto" } }, /* @__PURE__ */ jsx("h1", null, "Page Not Found"), /* @__PURE__ */ jsx("p", null, "The page you requested could not be found."), /* @__PURE__ */ jsx("a", { href: "/", style: { color: "#0066cc" } }, "Go to Home")),
              rootElement2
            );
          }
          return;
        }
      }
    }
    let pageProps = initialState.pageProps || {};
    if (Page.getServerSideProps) {
      try {
        const response = await fetch(`/api/__props${path}`);
        if (response.ok) {
          const data = await response.json();
          pageProps = data.props || {};
        }
      } catch (error) {
        console.error("[Router] Error fetching page props:", error);
      }
    }
    const updatedState = {
      ...initialState,
      route: path,
      pageProps
    };
    const rootElement = document.getElementById("root");
    if (!rootElement)
      return;
    if (isHydrating2 && path === initialState.route) {
      console.log("[Client] Hydrating server-rendered content");
      hydrate(/* @__PURE__ */ jsx(Page, { ...pageProps, initialState: updatedState }), rootElement);
      isHydrating2 = false;
    } else {
      console.log("[Client] Rendering client-side");
      render(/* @__PURE__ */ jsx(Page, { ...pageProps, initialState: updatedState }), rootElement);
    }
  } catch (error) {
    console.error("[Router] Navigation error:", error);
  }
}
handleRouteChange(window.location.pathname, false);
document.addEventListener("click", (e) => {
  let target = e.target;
  while (target && target.tagName !== "A") {
    target = target.parentElement;
    if (!target)
      break;
  }
  if (target && target.tagName === "A" && target.getAttribute("href") && target.getAttribute("href")?.startsWith("/") && !target.getAttribute("href")?.startsWith("//") && !target.getAttribute("target")) {
    e.preventDefault();
    const href = target.getAttribute("href") || "/";
    handleRouteChange(href);
  }
});
window.addEventListener("popstate", () => {
  handleRouteChange(window.location.pathname, false);
});
if (typeof io !== "undefined") {
  const socket = io();
  socket.on("reload", () => {
    console.log("[Dev] Reloading page due to file changes");
    window.location.reload();
  });
}
//# sourceMappingURL=main.js.map
