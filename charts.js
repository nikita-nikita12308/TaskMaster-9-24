module.exports.generateBarChartUrl = function (param) {
  const chartData = {
    type: 'bar',
    data: {
      labels: ['Остап', 'Теленик', 'Олійник', 'Сперкач'],
      datasets: [
        {
          label: 'Users (thousands)',
          data: [51, 69, 70, 100],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#fff',
          backgroundColor: 'rgba(34, 139, 34, 0.6)',
          borderColor: 'rgba(34, 139, 34, 1.0)',
          borderWidth: 1,
          borderRadius: 5,
          formatter: (value) => {
            return value + 'asds';
          },
        },
      },
    },
  };

  const chartData2 = {
    type: 'radialGauge',
    data: {
      datasets: [
        {
          data: [80],
          backgroundColor: '#4d4dff',
        },
      ],
    },
    options: {
      domain: [0, 100],
      trackColor: '#f0f8ff',
      centerPercentage: 90,
      centerArea: {
        text: (val) => val + '%',
      },
    },
  };

  const chartData3 = {
    type: 'bar',
    data: {
      labels: ['Остап'],
      datasets: [
        {
          label: 'lab1',
          data: [1],
          backgroundColor: 'rgba(0, 255, 0, 0.4)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
        {
          label: 'lab2',
          data: [1],
          backgroundColor: 'rgba(0, 0, 255, 0.4)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
        {
          label: 'lab3',
          data: [1],
          backgroundColor: 'rgba(0, 0, 255, 0.4)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
        {
          label: 'lab4',
          data: [1],
          backgroundColor: 'rgba(0, 255, 0, 0.4)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
      ],
    },
    options: {},
  };

  const chartData4 = {
    type: 'horizontalBar',
    data: {
      labels: [''],
      datasets: [
        {
          label: 'Лаб1',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          data: [1],
        },
        {
          label: 'Лаб2',
          backgroundColor: 'rgba(0, 255, 0, 0.4)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          data: [1],
        },
        {
          label: 'Лаб3',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          data: [1],
        },
        {
          label: 'Лаб4',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          data: [1],
        },
      ],
    },
    options: {
      elements: {
        rectangle: {
          borderWidth: 2,
        },
      },
      responsive: true,
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: '@rifinann прогрес по Остап',
      },
    },
  };

  switch (param) {
    case 'allThreads':
      param = chartData;
      break;
    case 'progress':
      param = chartData2;
      break;
    default:
      param = chartData4;
      break;
  }

  const chartConfigString = encodeURIComponent(JSON.stringify(param));

  const baseUrl = 'https://quickchart.io/chart';
  const chartUrl = `${baseUrl}?c=${chartConfigString}`;

  return chartUrl;
};

module.exports.generateAllTopicsChartUrl = function (topics) {
  const labels = topics.map((topic) => topic.topic);
  const data = topics.map((topic) => topic.percentage);
  console.log(topics);
  console.log(labels);
  console.log(data);
  const chartData = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Всі теми',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#fff',
          backgroundColor: 'rgba(34, 139, 34, 0.6)',
          borderColor: 'rgba(34, 139, 34, 1.0)',
          borderWidth: 1,
          borderRadius: 5,
          formatter: (value) => {
            return value + 'asds';
          },
        },
      },
    },
  };

  const chartConfigString = encodeURIComponent(JSON.stringify(chartData));

  const baseUrl = 'https://quickchart.io/chart';
  const chartUrl = `${baseUrl}?c=${chartConfigString}`;

  return chartUrl;
};

module.exports.generateSpecificChartUrl = function (
  userNickname,
  topic,
  tasks
) {
  const datasets = tasks.map((task, index) => {
    return {
      label: task.description,
      backgroundColor: task.completed
        ? 'rgba(0, 255, 0, 0.4)'
        : 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 1,
      data: [1], // You can customize this based on your task data
    };
  });
  const chartData = {
    type: 'horizontalBar',
    data: {
      labels: [''],
      datasets: datasets,
    },
    options: {
      elements: {
        rectangle: {
          borderWidth: 2,
        },
      },
      responsive: true,
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: `${userNickname} прогрес по ${topic}`,
      },
    },
  };
  const chartConfigString = encodeURIComponent(JSON.stringify(chartData));

  const baseUrl = 'https://quickchart.io/chart';
  const chartUrl = `${baseUrl}?c=${chartConfigString}`;

  return chartUrl;
};

module.exports.generateOverAllChartUrl = function (percentage) {
  let color;
  if (percentage >= 75) {
    color = '#0df385';
  } else if (74 > percentage && percentage >= 30) {
    color = '#f3dc0b';
  } else {
    color = '#f3310b';
  }

  const chartData = {
    type: 'radialGauge',
    data: {
      datasets: [
        {
          data: [percentage],
          backgroundColor: color,
        },
      ],
    },
    options: {
      domain: [0, 100],
      trackColor: '#f0f8ff',
      centerPercentage: 90,
      centerArea: {
        text: (val) => val + '%',
      },
    },
  };

  const chartConfigString = encodeURIComponent(JSON.stringify(chartData));

  const baseUrl = 'https://quickchart.io/chart';
  const chartUrl = `${baseUrl}?c=${chartConfigString}`;

  return chartUrl;
};
