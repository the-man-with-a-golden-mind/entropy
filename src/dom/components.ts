/**
 * Registers named `<template>` elements as custom Web Components using
 * Shadow DOM. Fully independent of the reactive core – no context needed.
 */

export function registerTemplates(rootElement?: Element | Document): void {
  const root = rootElement ?? document;
  Array.from(root.querySelectorAll<HTMLTemplateElement>('template[name]')).forEach(
    template => registerComponent(template),
  );
}

export function registerComponent(template: HTMLTemplateElement): void {
  const name = template.getAttribute('name')?.toLowerCase();
  if (!name || customElements.get(name)) return;

  const ctor = class extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });

      // Inherit top-level stylesheets so components look consistent
      Array.from(document.getElementsByTagName('style')).forEach(style => {
        shadow.appendChild(style.cloneNode(true));
      });
      Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).forEach(
        link => shadow.appendChild(link.cloneNode(true)),
      );

      // Clone template content into shadow root
      Array.from(template.content.childNodes).forEach(child => {
        shadow.appendChild(child.cloneNode(true));
      });
    }
  };

  customElements.define(name, ctor);
}

export async function loadTemplateFile(file: string): Promise<void> {
  try {
    const html = await fetch(file).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    registerTemplates(wrapper);
  } catch (err) {
    console.error(`[entropy] Failed to load template file "${file}":`, err);
  }
}

export function stitchTagTemplate(
  strings: string[],
  ...values: unknown[]
): string {
  return strings.reduce(
    (acc, s, i) => acc + (values[i - 1] ?? '') + s,
  );
}

export function wrapInDiv(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}
