<template>
  <div class="user-edit-container">
    <!-- 先判断props.id是否存在，避免显示空账号 -->
    <a-card :title="`个人信息修改，当前账号： ${userAccount}`" :bordered="false">
      <a-form
        :model="formState"
        :rules="rules"
        @finish="handleSubmit"
        layout="vertical"
        ref="formRef"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名" name="userName">
              <a-input v-model:value="formState.userName" placeholder="请输入用户名" />
            </a-form-item>
          </a-col>
          <a-col v-if="loginUserStore.loginUser.userRole == 'admin'" :span="12">
            <a-form-item label="角色" name="userRole">
              <a-select v-model:value="formState.userRole" placeholder="请选择角色">
                <a-select-option value="user">普通用户</a-select-option>
                <a-select-option value="admin">管理员</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="密码" name="userPassword">
              <a-input-password v-model:value="formState.userPassword" placeholder="请输入新密码（不填则不修改）" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="确认密码" name="confirmPassword">
              <a-input-password v-model:value="formState.confirmPassword" placeholder="请再次输入新密码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="个人简介" name="userProfile">
          <a-textarea v-model:value="formState.userProfile" placeholder="请输入个人简介" :rows="4" />
        </a-form-item>

        <a-form-item label="头像" name="userAvatar">
          <a-upload
            v-model:file-list="fileList"
            list-type="picture-card"
            :before-upload="beforeUpload"
            :max-count="1"
            :custom-request="customRequest"
          >
            <div v-if="fileList.length < 1">
              <plus-outlined />
              <div class="ant-upload-text">上传</div>
            </div>
          </a-upload>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
          <a-button type="primary" html-type="submit" :loading="loading">提交修改</a-button>
          <a-button style="margin-left: 10px" @click="resetForm">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { getUserVoByIdUsingGet, updateUserUsingPost } from '@/api/userController.ts'
import { useRouter } from 'vue-router'

// 引入类型定义
type updateUserUsingPOSTParams = {
  id?: number;
  userAvatar?: string;
  userName?: string;
  userPassword?: string;
  userProfile?: string;
  userRole?: string;
};

// 定义接收父组件传递的id属性（核心修改点）
const props = defineProps<{
  id: string | number
}>()

// 表单引用
const formRef = ref();

// 存储从接口获取的用户账号（用于标题显示）
const userAccount = ref('');

// 表单数据（先初始化空值，后续通过接口赋值）
const formState = reactive<updateUserUsingPOSTParams & { confirmPassword?: string }>({
  id: undefined,
  userName: '',
  userPassword: '',
  confirmPassword: '',
  userAvatar: '',
  userProfile: '',
  userRole: '',
});

// 文件列表
const fileList = ref<UploadProps['fileList']>([]);

// 加载状态
const loading = ref(false);

// 表单验证规则
const rules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 16, message: '用户名长度应在4-16个字符之间', trigger: 'blur' },
  ],
  userPassword: [
    {
      validator: (rule: any, value: string) => {
        // 如果密码为空，则不验证
        if (!value) {
          return Promise.resolve();
        }
        // 如果密码不为空，则验证长度
        if (value.length < 6 || value.length > 20) {
          return Promise.reject('密码长度应在6-20个字符之间');
        }
        return Promise.resolve();
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      validator: (rule: any, value: string) => {
        // 如果密码为空，则不验证确认密码
        if (!formState.userPassword) {
          return Promise.resolve();
        }
        // 如果密码不为空，则验证确认密码是否一致
        if (value !== formState.userPassword) {
          return Promise.reject('两次输入的密码不一致');
        }
        return Promise.resolve();
      },
      trigger: 'blur',
    },
  ],
  userRole: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

// 自定义上传请求
const customRequest = ({ file, onSuccess }: any) => {
  // 这里不需要真正上传，只是将文件保存到表单状态中
  setTimeout(() => {
    onSuccess && onSuccess(file);
  }, 0);
};

// 上传前的钩子
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

let newLoginUser = ref<API.UserVO>({});

// 页面挂载时通过props.id获取用户最新信息
onMounted(async () => {
  try {
    console.log(props.id)
    // 校验props.id是否存在
    if (!props.id) {
      message.error('用户ID不存在，无法获取个人信息');
      return;
    }
    // 调用接口获取最新用户信息
    const res = await getUserVoByIdUsingGet({ id: props.id });
    if (res.data && res.data.data) {
      const userInfo = res.data.data;
      // 给表单赋值最新的用户信息
      formState.id = userInfo.id;
      formState.userName = userInfo.userName;
      formState.userAvatar = userInfo.userAvatar;
      formState.userProfile = userInfo.userProfile;
      formState.userRole = userInfo.userRole;
      // 存储用户账号用于标题显示
      userAccount.value = userInfo.userAccount || '';

      // 初始化头像文件列表
      if (formState.userAvatar) {
        fileList.value = [
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: formState.userAvatar,
          },
        ];
      }
    } else {
      message.error('获取用户信息失败：' + (res.data?.message || '未知错误'));
    }
  } catch (error) {
    console.error('获取用户信息异常：', error);
    message.error('获取用户信息失败，请刷新页面重试');
  }
});

const loginUserStore = useLoginUserStore();
const router = useRouter()


// 提交表单
const handleSubmit = async () => {
  try {
    loading.value = true;

    // 准备表单数据
    const formData: any = {
      id: formState.id,
      userName: formState.userName,
      userProfile: formState.userProfile,
      userRole: formState.userRole,
    };

    // 只有当密码不为空时，才将密码添加到表单数据中
    if (formState.userPassword) {
      formData.userPassword = formState.userPassword;
    }

    // 如果有上传的文件
    let file: File | undefined;
    if (fileList.value.length > 0 && fileList.value[0].originFileObj) {
      file = fileList.value[0].originFileObj;
    }

    // 确保 id 参数有值
    const params: any = {};
    if (formState.id) {
      params.id = formState.id;
    } else {
      // 如果 id 为空，使用props传递的id
      const userId = typeof props.id === 'string' ? Number(props.id) : props.id;
      params.id = userId;
    }

    // 调用更新用户接口
    const res = await updateUserUsingPost(
      { id: formState.id }, // params
      formData, // body
      file, // file
    );

    if (res) {
      message.success('更新成功!');
      // 更新后重新获取最新用户信息
     // const userId = typeof props.id === 'string' ? Number(props.id) : props.id;
      const refreshRes = await getUserVoByIdUsingGet({ id: props.id })
      if (refreshRes.data && refreshRes.data.data) {
        // 更新表单和账号显示
        const userInfo = refreshRes.data.data;
        formState.userName = userInfo.userName;
        formState.userAvatar = userInfo.userAvatar;
        formState.userProfile = userInfo.userProfile;
        formState.userRole = userInfo.userRole;
        userAccount.value = userInfo.userAccount || '';
        // 更新头像文件列表
        if (formState.userAvatar) {
          fileList.value = [
            {
              uid: '-1',
              name: 'image.png',
              status: 'done',
              url: formState.userAvatar,
            },
          ];
        }
        if(loginUserStore.loginUser.id == props.id){
          loginUserStore.setLoginUser(refreshRes.data.data);
        }
        if(loginUserStore.loginUser.userRole == "admin"){
          router.push('/admin/userManage');
        }
      } else {
        message.error('刷新数据失败，' + (refreshRes.data?.message || '未知错误'));
      }
    } else {
      message.error('更新失败，请稍后再试');
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    message.error('更新失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formRef.value.resetFields();
  // 重置时使用接口获取的最新数据
  formState.userName = formState.userName;
  formState.userProfile = formState.userProfile;
  formState.userRole = formState.userRole;
  formState.userAvatar = formState.userAvatar;
  formState.userPassword = '';
  formState.confirmPassword = '';

  fileList.value = formState.userAvatar ? [
    {
      uid: '-1',
      name: 'image.png',
      status: 'done',
      url: formState.userAvatar,
    },
  ] : [];
};

</script>

<style scoped>
.user-edit-container {
  padding: 24px;
  background-color: #f0f2f5;
}
</style>
