Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
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

  methods: {
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
