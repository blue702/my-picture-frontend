<template>
  <div id="globalSider">
    <a-layout-sider collapsed-width="0" breakpoint="lg"  v-if="loginUserStore.loginUser.id" class="sider" width="200">
      <a-menu
        mode="inline"
        v-model:selectedKeys="current"
        :items="menuItems"
        @click="doMenuClick"
      />
    </a-layout-sider>
  </div>

</template>
<script lang="ts" setup>
import { computed, h, ref } from 'vue'
import { UserOutlined, PictureOutlined, CloudOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'


const loginUserStore = useLoginUserStore()

const menuItems  = [
  {
    key: '/',
    label: '公共图库',
    icon: () => h(PictureOutlined),
  },
  {
    key: '/my_space',
    label: '我的空间',
    icon: () => h(CloudOutlined),
  },
]

const router = useRouter();

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  });
};

// 当前选中菜单要高亮
const current = ref<string[]>([])
// 监听路由变化，更新当前选中菜单
router.afterEach((to, from, next) => {
  current.value = [to.path];
});



</script>
<style scoped>

</style>


