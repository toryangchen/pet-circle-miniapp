import { bootstrapSession } from "@utils/session";

App<IAppOption>({
  globalData: {},
  onLaunch() {
    void bootstrapSession();
  },
});
