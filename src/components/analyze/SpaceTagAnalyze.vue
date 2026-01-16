<template>
  <div class="space-tag-analyze">
    <a-card title="图库标签词云">
        <v-chart :option="options" style="height: 320px; max-width: 100%;" :loading="loading" />
    </a-card>
  </div>


</template>

<script setup lang="ts">
import 'echarts'
import 'echarts-wordcloud'
import VChart from "vue-echarts";
import "echarts";
import { computed, ref, watchEffect } from 'vue'
import { getSpaceCategoryAnalyzeUsingPost, getSpaceTagAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'
import { message } from 'ant-design-vue'

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})


// 图表数据
const dataList = ref<API.SpaceTagAnalyzeResponse[]>([])
const loading = ref(true)

/**
 * 加载数据
 */
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceTagAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0) {
    dataList.value = res.data.data ?? []
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}



const options = computed(() => {
  const tagData = dataList.value.map((item) => ({
    name: item.tag,
    value: item.count,
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}: ${params.value} 次`,
    },
    series: [
      {
        type: 'wordCloud',
        gridSize: 10,
        sizeRange: [20, 100], // 字体大小范围
        rotationRange: [-90, 90],
        shape: 'circle',
        textStyle: {
          color: () =>
            `rgb(${Math.round(Math.random() * 255)}, ${Math.round(
              Math.random() * 255,
            )}, ${Math.round(Math.random() * 255)})`, // 随机颜色
        },
        data: tagData,
      },
    ],
  }
})

/**
 * 监听变量，改变时触发数据的重新加载
 */
watchEffect(() => {
  // fetchData函数里面的任何变量改变都会触发该函数
  fetchData()
})
</script>

<style scoped>

</style>
