async function loadComponent(target) {
  const source = target.dataset.component;
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load component: ${source}`);
  }

  target.innerHTML = await response.text();
}

async function boot() {
  const slots = [...document.querySelectorAll("[data-component]")];
  await Promise.all(slots.map(loadComponent));
  document.body.dataset.ready = "true";
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="load-error"><h1>Page failed to load</h1><p>${error.message}</p></main>`;
});
