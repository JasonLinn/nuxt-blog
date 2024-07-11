import useStore from '@/store';

export default defineNuxtPlugin(({ $pinia }) => {
  return {
    provide: {
      store: useStore($pinia)
    }
  };
});