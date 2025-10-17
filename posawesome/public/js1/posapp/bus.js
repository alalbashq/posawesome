import mitt from 'mitt';

const emitter = mitt();

export default {
  install(app) {
    app.config.globalProperties.__ = window.__;
    app.config.globalProperties.frappe = window.frappe;
    app.config.globalProperties.eventBus = emitter;
    app.provide('eventBus', emitter); // ⬅️ هذا يسمح بالـ inject
  }
};

export { emitter };
