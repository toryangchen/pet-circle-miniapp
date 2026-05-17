Component({
  options: {
    virtualHost: true,
  },
  externalClasses: ["custom-class"],
  properties: {
    item: {
      type: Object,
      value: {},
    },
    imageMode: {
      type: String,
      value: "widthFix",
    },
    fixedImageHeight: {
      type: Boolean,
      value: false,
    },
    showBadge: {
      type: Boolean,
      value: false,
    },
  },
});
