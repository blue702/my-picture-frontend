import { defineStore } from "pinia";
import { ref } from "vue";
import { getLoginUserUsingGet } from '@/api/userController.ts'

/**
 * 储存登录用户信息
 */
export const useLoginUserStore = defineStore("loginUser", () => {

  // 默认值
  const loginUser = ref<API.LoginUserVO>({
    userName: "未登录",
  });

  /**
   * 远程获取当前登录用户信息
   */
  async function fetchLoginUser() {
    const res = await getLoginUserUsingGet()
    if (res.data.code === 0 && res.data.data) {
      loginUser.value = res.data.data
    }
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
