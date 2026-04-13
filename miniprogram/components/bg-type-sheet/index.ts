Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(nextValue: boolean) {
        this.syncVisibility(nextValue);
      },
    },
    value: {
      type: String,
      value: "main-bg-01",
    },
    options: {
      type: Array,
      value: [],
    },
  },

  data: {
    rendered: false,
    active: false,
  },

  lifetimes: {
    attached() {
      this.syncVisibility(this.properties.visible);
    },
  },

  methods: {
    syncVisibility(visible: boolean) {
      if (visible) {
        this.setData({
          rendered: true,
        });

        setTimeout(() => {
          this.setData({
            active: true,
          });
        }, 16);
        return;
      }

      this.setData({
        active: false,
      });

      setTimeout(() => {
        if (this.properties.visible) {
          return;
        }

        this.setData({
          rendered: false,
        });
      }, 220);
    },

    handleMaskTap() {
      this.triggerEvent("close");
    },

    stopPropagation() {},

    handleOptionTap(event: WechatMiniprogram.BaseEvent) {
      const { value } = event.currentTarget.dataset as { value?: string };
      if (!value) {
        return;
      }

      this.triggerEvent("change", { value });
    },

    handleCancelTap() {
      this.triggerEvent("close");
    },

    handleConfirmTap() {
      this.triggerEvent("confirm");
    },
  },
});
