import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 储存登录用户信息
 */
export const useLoginUserStore = defineStore("loginUser", () => {

  // 默认值
  const loginUser = ref<any>({
    userName: "未登录",
  });

  /**
   * 获取当前登录用户信息
   */
  async function fetchLoginUser() {
    // todo 由于后端还没提供接口，暂时注释
    // const res = await getCurrentUser();
    // if (res.data.code === 0 && res.data.data) {
    //   loginUser.value = res.data.data;
    // }
    // 测试用户登录，3 秒后登录
    setTimeout(() => {
      loginUser.value = { userName: '测试用户', id: 1 }
    }, 3000)
  }

  /**
   * 设置当前登录用户信息
   * @param newLoginUser
   */
  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser;
  }

  return { loginUser, setLoginUser, fetchLoginUser };
});
