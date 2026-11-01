/*
  game.js

  第一組 randomEvents：
  - 20 題選擇型隨機事件
  - 每個必填題完成後 20% 機率觸發
  - 玩家需要選擇
  - 已出現事件不可重複

  第二組 directEvents：
  - 每個必填題完成後 60% 機率觸發
  - 每次只出現 1 題
  - 不需要玩家選擇
  - 已出現事件不可重複

  第三組 directEvents2：
  - 一場遊戲開始時隨機決定總共出現 3～6 題
  - 每次只出現 1 題
  - 每次隨機抽取尚未出現的事件
  - 整場遊戲不重複
  - 不會一次連續出現多題
*/

/* =====================================================
   基本設定
===================================================== */

const INITIAL_MONEY = 12000;
const INITIAL_HEALTH = 80;
const INITIAL_HAPPINESS = 80;

const RANDOM_EVENT_CHANCE = 0.2;
const DIRECT_EVENT_CHANCE = 0.6;
const DIRECT_EVENT_2_CHANCE = 0.5;

const SPECIAL_CONDITION_CHANCE = 0.7;
const CHOICE_HEALTH_COST = 2;

/* =====================================================
   遊戲狀態
===================================================== */

const game = {
  page: "envelope",

  money: INITIAL_MONEY,
  health: INITIAL_HEALTH,
  happiness: INITIAL_HAPPINESS,

  week: 1,
  questionIndex: 0,

  totalSpent: 0,
  totalIncome: 0,

  currentResult: null,
  selectedChoice: null,

  usedEventIds: [],
  usedDirectEventIds: [],
  usedDirectEventIds2: [],

  /*
    directEvents2 本局總共要出現幾題
  */
  directEvents2Target: 0,

  /*
    directEvents2 本局已出現幾題
  */
  directEvents2Count: 0,

  pendingProgress: null,

  records: [],

  spending: {
    飲食: 0,
    交通: 0,
    娛樂: 0,
    購物: 0,
    醫療: 0,
    課業: 0,
    生活用品: 0,
    其他: 0
  }
};

/* =====================================================
   工具函式
===================================================== */

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatMoney(value) {
  const number = Math.max(
    0,
    Math.round(Number(value) || 0)
  );

  return "NT$" + number.toLocaleString("zh-TW");
}

function formatMoneyChange(value) {
  const number = Number(value) || 0;

  if (number === 0) {
    return "NT $0";
  }

  if (number > 0) {
    return "+" + formatMoney(number);
  }

  return "-" + formatMoney(Math.abs(number));
}

function formatNumberChange(value) {
  const number = Number(value) || 0;

  if (number > 0) {
    return "+" + number;
  }

  return String(number);
}

function shuffle(array) {
  return array
    .map((item) => ({
      item,
      sort: Math.random()
    }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.item);
}

function getExpense(option) {
  return Math.max(
    0,
    -(Number(option.money) || 0)
  );
}

function hasAffordableOption(question) {
  return question.options.some((option) => {
    return getExpense(option) <= game.money;
  });
}

/* =====================================================
   必填題目
===================================================== */

const regularQuestions = [
  {
    id: "week1-food",
    week: 1,
    category: "飲食",
    title: "這週的三餐要怎麼安排呢？",
    text: "新的一週開始了！先安排一下這週的飲食吧。",
    options: [
      {
        title: "早餐超商、午餐學餐、晚餐自己煮",
        money: -1500,
        health: 6,
        happiness: 2,
        feedback: "自己煮晚餐讓飲食多了一點掌握感，也替生活省下一些支出。"
      },
      {
        title: "三餐以外食為主，偶爾吃點好料",
        money: -2500,
        health: 1,
        happiness: 9,
        feedback: "這週吃得比較有儀式感，雖然花費高一些，但也增加了生活中的快樂。"
      },
      {
        title: "早餐簡單吃、午餐學餐、晚餐平價外食",
        money: -1800,
        health: 4,
        happiness: 5,
        feedback: "你在方便、花費和滿足感之間取得了不錯的平衡。"
      }
    ]
  },

  {
    id: "week1-transport",
    week: 1,
    category: "交通",
    title: "週末回家的交通安排",
    text: "這個週末想回家一趟，請記得交通費為來回價格。",
    options: [
      {
        title: "搭乘客運，時間較長但價格實惠【來回】",
        money: -700,
        health: 0,
        happiness: 2,
        feedback: "客運需要多花一點時間，但來回交通費比較實惠。"
      },
      {
        title: "搭火車，速度和價格都適中【來回】",
        money: -1100,
        health: 1,
        happiness: 5,
        feedback: "火車讓往返行程舒服不少，只是來回費用也需要安排。"
      },
      {
        title: "搭高鐵，快速往返學校與家裡【來回】",
        money: -2400,
        health: 2,
        happiness: 8,
        feedback: "高鐵讓你快速完成來回行程，但支出相對較高。"
      }
    ]
  },

  {
    id: "week1-friends",
    week: 1,
    category: "娛樂",
    title: "朋友邀請週末聚餐",
    text: "朋友突然邀請你一起吃燒肉，你想怎麼回應呢？",
    options: [
      {
        title: "答應邀約，一起享受聚餐",
        money: -550,
        health: -1,
        happiness: 10,
        feedback: "和朋友一起吃飯讓你充滿能量，社交也是生活的一部分。"
      },
      {
        title: "提議改吃平價餐廳",
        money: -250,
        health: 1,
        happiness: 6,
        feedback: "你保留了聚餐的樂趣，也把支出控制在比較輕鬆的範圍內。"
      },
      {
        title: "這次先不參加",
        money: 0,
        health: 0,
        happiness: -3,
        feedback: "這次你選擇把錢留下來，偶爾婉拒邀約也是一種生活安排。"
      }
    ]
  },

  {
    id: "week2-food",
    week: 2,
    category: "飲食",
    title: "第二週的飲食計畫",
    text: "這週你想用什麼方式安排自己的三餐呢？",
    options: [
      {
        title: "準備便當，搭配學餐與水果",
        money: -1450,
        health: 8,
        happiness: 3,
        feedback: "提早準備讓你更容易掌握飲食，也讓生活多了一點穩定感。"
      },
      {
        title: "平價外食搭配一餐小確幸",
        money: -1750,
        health: 4,
        happiness: 7,
        feedback: "你在預算內留下了一點享受空間，吃得滿足也不會太有壓力。"
      },
      {
        title: "本週以學餐和簡單自煮為主",
        money: -1300,
        health: 5,
        happiness: 1,
        feedback: "這是比較節制的一週，但也要記得留意營養和休息。"
      }
    ]
  },

  {
    id: "week2-shopping",
    week: 2,
    category: "購物",
    title: "網拍上的心動衣服",
    text: "你看到一件很喜歡的衣服，價格是 NT $950。",
    options: [
      {
        title: "直接下單",
        money: -950,
        health: 0,
        happiness: 9,
        feedback: "新衣服帶來了立即的滿足感，偶爾犒賞自己也是生活的一部分。"
      },
      {
        title: "先加入購物車，過幾天再決定",
        money: 0,
        health: 0,
        happiness: 3,
        feedback: "你沒有壓抑喜歡的東西，而是留一點時間思考。"
      },
      {
        title: "放棄購買，把錢留作備用",
        money: 0,
        health: 0,
        happiness: -2,
        feedback: "你把這筆錢保留下來，月底遇到突發支出時會更有彈性。"
      }
    ]
  },

  {
    id: "week3-food",
    week: 3,
    category: "飲食",
    title: "第三週的三餐選擇",
    text: "作業變多了，你要怎麼在時間、健康和預算之間取得平衡？",
    options: [
      {
        title: "週末先備餐，平日簡單加熱",
        money: -1450,
        health: 7,
        happiness: 4,
        feedback: "你先花時間準備，換來平日更穩定的飲食節奏。"
      },
      {
        title: "每天選擇方便的外食",
        money: -2100,
        health: 2,
        happiness: 6,
        feedback: "便利性讓你少了不少煩惱，但這週的花費也明顯增加。"
      },
      {
        title: "學餐、麵包和簡單湯品搭配",
        money: -1250,
        health: 3,
        happiness: 2,
        feedback: "你選擇了簡單的安排，但不要長期忽略食物多樣性。"
      }
    ]
  },

  {
    id: "week3-transport",
    week: 3,
    category: "交通",
    title: "隔週回家的交通安排",
    text: "又到了回家的時間，這次一樣要計算來回交通費。",
    options: [
      {
        title: "搭乘客運，時間較長但價格實惠【來回】",
        money: -700,
        health: 0,
        happiness: 2,
        feedback: "客運價格較實惠，能替生活費保留更多空間。"
      },
      {
        title: "搭火車，速度和價格都適中【來回】",
        money: -1100,
        health: 1,
        happiness: 5,
        feedback: "火車讓往返行程比較舒服，也讓你回家時多了一點餘裕。"
      },
      {
        title: "搭高鐵，快速往返學校與家裡【來回】",
        money: -2400,
        health: 2,
        happiness: 8,
        feedback: "高鐵讓你快速完成往返行程，但這次支出需要仔細評估。"
      }
    ]
  },

  {
    id: "week3-entertainment",
    week: 3,
    category: "娛樂",
    title: "今晚要不要看場電影？",
    text: "朋友邀請你去看電影，也可以選擇其他活動。",
    options: [
      {
        title: "看電影加飲料",
        money: -420,
        health: 0,
        happiness: 10,
        feedback: "電影替忙碌的生活按下暫停鍵，也帶來了放鬆感。"
      },
      {
        title: "改成一起散步、聊天和吃點心",
        money: -150,
        health: 2,
        happiness: 7,
        feedback: "你選擇了低成本的放鬆方式，和朋友相處同樣很有價值。"
      },
      {
        title: "留在家裡看免費串流內容",
        money: 0,
        health: 0,
        happiness: 4,
        feedback: "免費娛樂也能帶來休息效果，你把預算留給其他需要。"
      }
    ]
  },

  {
    id: "week4-food",
    week: 4,
    category: "飲食",
    title: "最後一週的飲食安排",
    text: "月底快到了，你會怎麼安排最後一週的飲食？",
    options: [
      {
        title: "採買食材自己煮，搭配一兩次外食",
        money: -1400,
        health: 8,
        happiness: 5,
        feedback: "你用有計畫的方式度過最後一週，健康和預算都受到照顧。"
      },
      {
        title: "外食為主，給自己一個月底獎勵",
        money: -2300,
        health: 3,
        happiness: 10,
        feedback: "你選擇在月底享受一下，但剩餘金額也需要留意。"
      },
      {
        title: "清理冰箱庫存，搭配平價餐點",
        money: -950,
        health: 5,
        happiness: 3,
        feedback: "你善用現有食材，讓月底支出變得輕盈。"
      }
    ]
  }
];

/* =====================================================
   20 題選擇型隨機事件
===================================================== */

const randomEvents = [
  {
    id: "event-01",
    category: "醫療",
    title: "突如其來的感冒",
    text: "最近天氣變化大，你開始出現感冒症狀，身體不太舒服。",
    options: [
      {
        title: "去診所看醫生",
        money: -300,
        health: 5,
        happiness: 2,
        feedback: "你花了一筆醫療費，但及時照顧身體也是重要的生活安排。"
      },
      {
        title: "買成藥並在家休息",
        money: -150,
        health: 0,
        happiness: 1,
        feedback: "你用較低的支出處理症狀，也安排時間休息。"
      },
      {
        title: "先休息觀察，必要時就醫",
        money: 0,
        health: -2,
        happiness: -2,
        feedback: "你暫時觀察身體狀況，若症狀持續仍應尋求醫療協助。"
      }
    ]
  },

  {
    id: "event-02",
    category: "娛樂",
    title: "朋友突然約吃燒肉",
    text: "朋友傳訊息問你今晚要不要一起吃燒肉。",
    options: [
      {
        title: "直接答應，吃好吃滿",
        money: -600,
        health: 2,
        happiness: 12,
        feedback: "和朋友一起吃飯讓你收穫了很棒的回憶。"
      },
      {
        title: "提議改吃平價餐廳",
        money: -250,
        health: 2,
        happiness: 8,
        feedback: "你保留了聚餐的樂趣，也讓支出比較容易負擔。"
      },
      {
        title: "這次先不參加",
        money: 0,
        health: 0,
        happiness: -3,
        feedback: "你選擇把錢留下來，之後還是可以和朋友保持聯絡。"
      }
    ]
  },

  {
    id: "event-03",
    category: "其他",
    title: "手機突然故障",
    text: "手機開始頻繁當機，甚至影響上課和聯絡。",
    options: [
      {
        title: "直接送修",
        money: -1000,
        health: 0,
        happiness: 3,
        feedback: "你直接處理了手機問題，日常聯絡方便許多。"
      },
      {
        title: "先找教學自己排除問題",
        money: -100,
        health: 0,
        happiness: 1,
        feedback: "你先用低成本方式嘗試解決，保留了更多預算彈性。"
      },
      {
        title: "暫時繼續使用",
        money: 0,
        health: 0,
        happiness: -5,
        feedback: "你暫時沒有支出，但手機問題讓生活多了一點不便。"
      }
    ]
  },

  {
    id: "event-04",
    category: "購物",
    title: "網購平台限時優惠",
    text: "購物平台跳出限時折扣通知，購物車裡的衣服終於降價了！",
    options: [
      {
        title: "趁優惠直接買下來",
        money: -800,
        health: 0,
        happiness: 10,
        feedback: "你把喜歡的衣服買下來，折扣增加了一點滿足感。"
      },
      {
        title: "先放進收藏，過幾天再決定",
        money: 0,
        health: 0,
        happiness: 3,
        feedback: "你沒有急著付款，也替自己爭取思考時間。"
      },
      {
        title: "關掉通知，不再考慮",
        money: 0,
        health: 0,
        happiness: -1,
        feedback: "你把資金留給更需要的地方。"
      }
    ]
  },

  {
    id: "event-05",
    category: "生活用品",
    title: "房間生活用品用完了",
    text: "衛生紙、洗衣精和沐浴乳幾乎同時用完。",
    options: [
      {
        title: "一次買齊所有用品",
        money: -500,
        health: 2,
        happiness: 3,
        feedback: "一次補齊用品最省心，接下來的生活也比較安心。"
      },
      {
        title: "只買目前最急需的",
        money: -250,
        health: 1,
        happiness: 1,
        feedback: "你先處理最急迫的需求，把其他支出延後。"
      },
      {
        title: "先檢查庫存，確認是否有替代品",
        money: 0,
        health: 0,
        happiness: 1,
        feedback: "你先盤點現有物品，也保留更多彈性。"
      }
    ]
  },

  {
    id: "event-06",
    category: "娛樂",
    title: "期中考週的誘惑",
    text: "期中考即將到來，讀書讀得有點疲憊。",
    options: [
      {
        title: "去看電影，好好放鬆",
        money: -350,
        health: 2,
        happiness: 10,
        feedback: "適度休息讓你重新充電，也讓讀書不再只有壓力。"
      },
      {
        title: "留在宿舍休息、看免費影片",
        money: 0,
        health: 3,
        happiness: 5,
        feedback: "你選擇零支出的休息方式，也讓身體得到恢復。"
      },
      {
        title: "繼續讀書，把進度完成",
        money: 0,
        health: -2,
        happiness: -4,
        feedback: "你完成了讀書進度，但也不要長時間忽略休息。"
      }
    ]
  },

  {
    id: "event-07",
    category: "交通",
    title: "交通卡餘額不足",
    text: "出門時發現交通卡餘額不足，今天還有重要事情要處理。",
    options: [
      {
        title: "直接加值 500 元",
        money: -500,
        health: 0,
        happiness: 2,
        feedback: "你一次補足交通費，接下來幾趟行程會比較安心。"
      },
      {
        title: "先加值 200 元",
        money: -200,
        health: 0,
        happiness: 1,
        feedback: "你先處理眼前需要，保留其他預算彈性。"
      },
      {
        title: "改變今天的行程，減少搭車次數",
        money: 0,
        health: -1,
        happiness: -3,
        feedback: "你省下交通支出，但行程安排也受到一些影響。"
      }
    ]
  },

  {
    id: "event-08",
    category: "娛樂",
    title: "朋友生日快到了",
    text: "好友生日即將到來，你想準備一份禮物表達心意。",
    options: [
      {
        title: "買一份精心挑選的禮物",
        money: -700,
        health: 0,
        happiness: 12,
        feedback: "你準備了一份有心意的禮物，和朋友的回憶更加深刻。"
      },
      {
        title: "親手製作小卡片或手作禮物",
        money: -150,
        health: 0,
        happiness: 10,
        feedback: "手作禮物不一定昂貴，但時間和心意同樣珍貴。"
      },
      {
        title: "傳訊息祝福，之後再補送",
        money: 0,
        health: 0,
        happiness: 3,
        feedback: "你先送上祝福，之後再找適合的時間準備禮物。"
      }
    ]
  },

  {
    id: "event-09",
    category: "其他",
    title: "電腦設備突然故障",
    text: "正在趕作業時，滑鼠突然失去反應。",
    options: [
      {
        title: "買一個新的滑鼠",
        money: -800,
        health: 0,
        happiness: 5,
        feedback: "你直接排除了設備問題，作業進度也順利許多。"
      },
      {
        title: "買平價替代款",
        money: -350,
        health: 0,
        happiness: 3,
        feedback: "你用較低成本解決問題，在功能和預算間取得折衷。"
      },
      {
        title: "暫時使用觸控板",
        money: 0,
        health: -1,
        happiness: -3,
        feedback: "你暫時不花錢，但使用上的不便增加了壓力。"
      }
    ]
  },

  {
    id: "event-10",
    category: "其他",
    title: "意外收到紅包",
    text: "家人突然傳訊息，說要給你一筆額外生活補助！",
    options: [
      {
        title: "全部存起來",
        money: 1000,
        health: 0,
        happiness: 5,
        feedback: "你把補助保留下來，月底會更有安全感。"
      },
      {
        title: "留一部分當作娛樂費",
        money: 500,
        health: 0,
        happiness: 10,
        feedback: "你保留一些補助，也替生活增加享受空間。"
      },
      {
        title: "買一直想買的小東西",
        money: 200,
        health: 0,
        happiness: 12,
        feedback: "你用一部分補助犒賞自己，獲得了很高的滿足感。"
      }
    ]
  },

  {
    id: "event-11",
    category: "其他",
    title: "撿到錢了！",
    text: "走在路上時，你意外發現地上有一張鈔票。",
    options: [
      {
        title: "拿去附近服務台詢問失主",
        money: 0,
        health: 0,
        happiness: 5,
        feedback: "你選擇以負責任的方式處理，心裡也感到踏實。"
      },
      {
        title: "確認沒有人回來找，再交給相關單位",
        money: 0,
        health: 0,
        happiness: 3,
        feedback: "你先觀察現場，再把錢交給適當單位處理。"
      }
    ]
  },

  {
    id: "event-12",
    category: "飲食",
    title: "外送平台折價券",
    text: "手機突然收到一張即將到期的外送折價券。",
    options: [
      {
        title: "點一份喜歡的餐點",
        money: -150,
        health: 1,
        happiness: 8,
        feedback: "折價券降低了外送支出，也替忙碌的一天增加享受。"
      },
      {
        title: "找朋友一起訂，分攤運費",
        money: -80,
        health: 1,
        happiness: 6,
        feedback: "你和朋友一起分享餐點，支出降低，也多了一點互動。"
      },
      {
        title: "不需要就不買",
        money: 0,
        health: 0,
        happiness: 1,
        feedback: "你沒有因為折價就勉強消費，成功保留了預算。"
      }
    ]
  },

  {
    id: "event-13",
    category: "飲食",
    title: "同學請喝飲料",
    text: "同學突然說今天心情好，要請你喝飲料！",
    options: [
      {
        title: "開心接受",
        money: 0,
        health: 0,
        happiness: 8,
        feedback: "簡單的小確幸也能讓一天變得更愉快。"
      },
      {
        title: "下次換你請回去",
        money: -60,
        health: 0,
        happiness: 10,
        feedback: "你接受了飲料，也決定之後回應這份心意。"
      }
    ]
  },

  {
    id: "event-14",
    category: "交通",
    title: "雨天突襲",
    text: "出門上課時突然下起大雨，你沒有帶傘。",
    options: [
      {
        title: "買一把新傘",
        money: -250,
        health: 2,
        happiness: 2,
        feedback: "你買了能重複使用的雨具，也避免身體被雨淋濕。"
      },
      {
        title: "買便利商店輕便雨衣",
        money: -80,
        health: 1,
        happiness: 1,
        feedback: "你用較低支出解決眼前問題，行程也能繼續。"
      },
      {
        title: "等雨小一點再出發",
        money: 0,
        health: -1,
        happiness: -2,
        feedback: "你省下支出，但等待也讓行程和心情受到影響。"
      }
    ]
  },

  {
    id: "event-15",
    category: "課業",
    title: "二手社團挖到寶",
    text: "你在學校二手社團看到有人出售需要的課本。",
    options: [
      {
        title: "立刻購入",
        money: -300,
        health: 0,
        happiness: 8,
        feedback: "你用相對低的價格買到需要的課本。"
      },
      {
        title: "先確認書況和價格",
        money: 0,
        health: 0,
        happiness: 2,
        feedback: "你沒有急著消費，而是先確認內容和價格是否值得。"
      },
      {
        title: "使用圖書館資源",
        money: 0,
        health: 0,
        happiness: 5,
        feedback: "你善用免費資源，也替預算保留了空間。"
      }
    ]
  },

  {
    id: "event-16",
    category: "其他",
    title: "臨時收到打工邀約",
    text: "朋友問你要不要代班，剛好可以賺一點額外收入。",
    options: [
      {
        title: "接下代班",
        money: 800,
        health: -3,
        happiness: 3,
        feedback: "你增加了收入，但也用休息時間換取這筆資金。"
      },
      {
        title: "婉拒，保留休息時間",
        money: 0,
        health: 2,
        happiness: 3,
        feedback: "你沒有增加收入，但保留了休息時間。"
      }
    ]
  },

  {
    id: "event-17",
    category: "生活用品",
    title: "宿舍設備故障",
    text: "房間的電燈突然不亮了，影響日常生活。",
    options: [
      {
        title: "自己確認是否只是燈泡故障",
        money: 0,
        health: 0,
        happiness: 2,
        feedback: "你先確認問題來源，沒有急著支出。"
      },
      {
        title: "購買新的燈泡",
        money: -150,
        health: 0,
        happiness: 3,
        feedback: "你用小額支出快速改善房間照明。"
      },
      {
        title: "聯絡房東或管理人員",
        money: 0,
        health: 0,
        happiness: 3,
        feedback: "你先尋求協助，讓問題交由適合的人處理。"
      }
    ]
  },

  {
    id: "event-18",
    category: "其他",
    title: "久違的家人來電",
    text: "家人突然打電話來，問你最近生活費夠不夠。",
    options: [
      {
        title: "坦白分享最近的花費",
        money: 0,
        health: 0,
        happiness: 6,
        feedback: "你和家人分享近況，也讓彼此更了解你的生活狀態。"
      },
      {
        title: "說目前還過得不錯",
        money: 0,
        health: 0,
        happiness: 3,
        feedback: "簡單聊聊近況，也讓你感受到家人的關心。"
      }
    ]
  },

  {
    id: "event-19",
    category: "娛樂",
    title: "免費校園活動",
    text: "學校突然舉辦免費市集活動，有表演、遊戲和小禮物。",
    options: [
      {
        title: "去逛逛放鬆一下",
        money: 0,
        health: 1,
        happiness: 10,
        feedback: "免費活動讓你放鬆，也替平凡的一天增加驚喜。"
      },
      {
        title: "只參加有興趣的活動",
        money: 0,
        health: 1,
        happiness: 6,
        feedback: "你選擇自己真正有興趣的內容，輕鬆享受活動。"
      },
      {
        title: "留在房間休息",
        money: 0,
        health: 3,
        happiness: 2,
        feedback: "你把時間留給休息，讓身體得到更多恢復。"
      }
    ]
  },

  {
    id: "event-20",
    category: "其他",
    title: "意外的帳單",
    text: "你發現有一筆原本沒注意到的生活費需要支付。",
    options: [
      {
        title: "直接支付，避免忘記",
        money: -400,
        health: 0,
        happiness: -1,
        feedback: "你先處理帳單，避免之後忘記或產生更多麻煩。"
      },
      {
        title: "確認帳單內容及金額後再支付",
        money: -400,
        health: 0,
        happiness: 1,
        feedback: "你仔細確認內容後完成支付，心裡也比較安心。"
      }
    ]
  }
];

/* =====================================================
   第一組 directEvents
===================================================== */

const directEvents = [
  {
    id: "direct-01",
    title: "天降驚喜",
    text: "走在路上突然被鳥屎滴到，今天的運氣似乎不太好。",
    money: 0,
    health: 0,
    happiness: -5
  },
  {
    id: "direct-02",
    title: "撿到折價券",
    text: "買午餐時發現店家有折價券可以使用。",
    money: 50,
    health: 0,
    happiness: 0
  },
  {
    id: "direct-03",
    title: "意外的好天氣",
    text: "原本陰雨綿綿，出門時卻突然放晴。",
    money: 0,
    health: 0,
    happiness: 3
  },
  {
    id: "direct-04",
    title: "悠閒的早晨",
    text: "今天剛好提早起床，不用匆忙趕課。",
    money: 0,
    health: 3,
    happiness: 2
  },
  {
    id: "direct-05",
    title: "東西突然壞掉",
    text: "使用中的耳機突然故障，只好花錢處理。",
    money: -300,
    health: 0,
    happiness: 0
  },
  {
    id: "direct-06",
    title: "朋友請客",
    text: "朋友今天心情好，順便請你吃了一頓飯。",
    money: 100,
    health: 0,
    happiness: 3
  },
  {
    id: "direct-07",
    title: "搭車遇到熟人",
    text: "通勤時剛好遇到朋友，一路聊天到學校。",
    money: 0,
    health: 0,
    happiness: 4
  },
  {
    id: "direct-08",
    title: "意外加分",
    text: "老師突然公布上次作業成績，你的表現比預期好。",
    money: 0,
    health: 0,
    happiness: 5
  },
  {
    id: "direct-09",
    title: "下雨沒帶傘",
    text: "出門才發現忘記帶傘，只好淋雨回家。",
    money: 0,
    health: -3,
    happiness: -2
  },
  {
    id: "direct-10",
    title: "意外的小禮物",
    text: "收到家人或朋友送的小點心，心情變好了。",
    money: 0,
    health: 0,
    happiness: 5
  }
];

/* =====================================================
   第二組 directEvents2
===================================================== */

const directEvents2 = [
  {
    id: "direct2-01",
    title: "天降驚喜",
    text: "走在路上突然被鳥屎滴到，今天的運氣似乎不太好。",
    money: 0,
    health: 0,
    happiness: -5
  },
  {
    id: "direct2-02",
    title: "撿到折價券",
    text: "買午餐時發現店家有折價券可以使用。",
    money: 50,
    health: 0,
    happiness: 0
  },
  {
    id: "direct2-03",
    title: "意外的好天氣",
    text: "原本陰雨綿綿，出門時卻突然放晴。",
    money: 0,
    health: 0,
    happiness: 3
  },
  {
    id: "direct2-04",
    title: "悠閒的早晨",
    text: "今天剛好提早起床，不用匆忙趕課。",
    money: 0,
    health: 3,
    happiness: 2
  },
  {
    id: "direct2-05",
    title: "東西突然壞掉",
    text: "使用中的耳機突然故障，只好花錢處理。",
    money: -300,
    health: 0,
    happiness: 0
  },
  {
    id: "direct2-06",
    title: "朋友請客",
    text: "朋友今天心情好，順便請你吃了一頓飯。",
    money: 100,
    health: 0,
    happiness: 3
  },
  {
    id: "direct2-07",
    title: "搭車遇到熟人",
    text: "通勤時剛好遇到朋友，一路聊天到學校。",
    money: 0,
    health: 0,
    happiness: 4
  },
  {
    id: "direct2-08",
    title: "意外加分",
    text: "老師突然公布上次作業成績，你的表現比預期好。",
    money: 0,
    health: 0,
    happiness: 5
  },
  {
    id: "direct2-09",
    title: "下雨沒帶傘",
    text: "出門才發現忘記帶傘，只好淋雨回家。",
    money: 0,
    health: -3,
    happiness: -2
  },
  {
    id: "direct2-10",
    title: "意外的小禮物",
    text: "收到家人或朋友送的小點心，心情變好了。",
    money: 0,
    health: 0,
    happiness: 5
  }
];

/* =====================================================
   低狀態特殊情境
===================================================== */

const tiredQuestion1 = {
  id: "special-tired",
  category: "其他",
  title: "疲勞來信",
  text: "最近似乎太累了，精神狀態不太好。你想怎麼調整？",
  options: [
    {
      title: "先休息再處理事情",
      money: 0,
      health: 8,
      happiness: 2,
      feedback: "你先讓自己休息，身體狀態逐漸恢復。"
    },
    {
      title: "買營養餐補充體力",
      money: -250,
      health: 5,
      happiness: 3,
      feedback: "你花了一點錢照顧自己，也替身體補充能量。"
    },
    {
      title: "硬撐完成今天安排",
      money: 0,
      health: -8,
      happiness: -5,
      feedback: "你完成了原本的安排，但身體和心情承受更多負擔。"
    }
  ]
};

const relaxQuestion1 = {
  id: "special-relax",
  category: "娛樂",
  title: "想放鬆一下",
  text: "最近的生活讓你有點悶，或許可以安排一點休息時間。",
  options: [
    {
      title: "去看電影放鬆",
      money: -400,
      health: 1,
      happiness: 12,
      feedback: "你用一筆娛樂支出換來完整的放鬆時間。"
    },
    {
      title: "在家免費休息",
      money: 0,
      health: 2,
      happiness: 6,
      feedback: "你選擇零支出的休息方式，也成功讓自己放鬆下來。"
    },
    {
      title: "找朋友散步聊天",
      money: -80,
      health: 2,
      happiness: 8,
      feedback: "和朋友走走聊聊，讓你重新找回生活節奏。"
    }
  ]
};

/* =====================================================
   遊戲重置
===================================================== */

function resetGame() {
  game.page = "playing";

  game.money = INITIAL_MONEY;
  game.health = INITIAL_HEALTH;
  game.happiness = INITIAL_HAPPINESS;

  game.week = 1;
  game.questionIndex = 0;

  game.totalSpent = 0;
  game.totalIncome = 0;

  game.currentResult = null;
  game.selectedChoice = null;

  game.usedEventIds = [];
  game.usedDirectEventIds = [];
  game.usedDirectEventIds2 = [];

  /*
    每場遊戲隨機決定 directEvents2
    總共出現 3～6 題
  */
  game.directEvents2Target =
    Math.floor(Math.random() * 4) + 3;

  game.directEvents2Count = 0;

  game.pendingProgress = null;
  game.records = [];

  Object.keys(game.spending).forEach((category) => {
    game.spending[category] = 0;
  });
}

/* =====================================================
   取得目前必填題目
===================================================== */

function getCurrentRegularQuestion() {
  const weekQuestions =
    regularQuestions.filter(
      (question) => question.week === game.week
    );

  return weekQuestions[game.questionIndex] || null;
}

/* =====================================================
   狀態列
===================================================== */

function renderStatus() {
  return `
    <div class="game-status">
      <div class="status-item status-money">
        <span>💰 剩餘金錢</span>
        <strong>${formatMoney(game.money)}</strong>
      </div>

      <div class="status-item">
        <span>♡ 健康值</span>
        <strong>${game.health}/100</strong>

        <div class="status-bar">
          <div
            class="status-fill health-fill"
            style="width: ${game.health}%"
          ></div>
        </div>
      </div>

      <div class="status-item">
        <span>☺ 快樂值</span>
        <strong>${game.happiness}/100</strong>

        <div class="status-bar">
          <div
            class="status-fill happiness-fill"
            style="width: ${game.happiness}%"
          ></div>
        </div>
      </div>
    </div>
  `;
}

/* =====================================================
   失敗與特殊結局
===================================================== */

function checkImmediateEnding() {
  if (game.health <= 0) {
    showEnding(
      "燃燒生命的勇者",
      "你的健康值已經歸零。你完成了很多事情，但身體需要被好好照顧。",
      "health"
    );

    return true;
  }

  if (game.happiness <= 0) {
    showEnding(
      "大學生精神狀態",
      "你的快樂值已經歸零。這不代表你失敗，而是提醒你需要重新安排休息與支持。",
      "happiness"
    );

    return true;
  }

  return false;
}

function showFinancialFailure() {
  showEnding(
    "財務危機",
    "目前的剩餘金額不足以支付眼前情境，而且沒有任何可行方案。",
    "money"
  );
}

function showEnding(title, reason, type) {
  const screen =
    document.getElementById("screen");

  let label = "SPECIAL ENDING";

  if (type === "money") {
    label = "FINANCIAL CRISIS";
  }

  if (type === "health") {
    label = "HEALTH ENDING";
  }

  if (type === "happiness") {
    label = "HAPPINESS ENDING";
  }

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper final-paper">
        <div class="letter-stamp">
          SPECIAL<br>
          ENDING
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            ${label}
          </p>

          ${renderStatus()}

          <h1>${title}</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="reply-message">
            <p>${reason}</p>
          </div>

          <div class="reply-stats">
            <p>
              💰 目前剩餘金額：
              <strong>${formatMoney(game.money)}</strong>
            </p>

            <p>
              ♡ 目前健康值：
              <strong>${game.health}/100</strong>
            </p>

            <p>
              ☺ 目前快樂值：
              <strong>${game.happiness}/100</strong>
            </p>
          </div>

          <button
            id="restart-ending-button"
            class="letter-button"
            type="button"
          >
            重新挑戰
          </button>

          <br><br>

          <button
            id="home-ending-button"
            class="letter-button"
            type="button"
          >
            返回首頁
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById("restart-ending-button")
    .addEventListener("click", () => {
      resetGame();
      renderRegularQuestion();
    });

  document
    .getElementById("home-ending-button")
    .addEventListener("click", () => {
      resetGame();
      showEnvelope();
    });
}

/* =====================================================
   信封首頁
===================================================== */

function showEnvelope() {
  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="envelope-page">
      <div class="envelope-decoration envelope-decoration-left">
        ✦
      </div>

      <div class="envelope-decoration envelope-decoration-right">
        ♡
      </div>

      <div
        class="envelope"
        id="envelope"
        role="button"
        tabindex="0"
        aria-label="打開邀請函"
      >
        <div class="envelope-inside">
          <div class="inside-letter">
            💌
          </div>
        </div>

        <div class="envelope-body">
          <div class="envelope-line envelope-line-left"></div>
          <div class="envelope-line envelope-line-right"></div>
        </div>

        <div class="envelope-flap"></div>

        <div class="envelope-stamp">
          ✦
        </div>

        <div class="envelope-heart">
          ♡
        </div>
      </div>

      <p class="envelope-hint">
        點擊信封，開啟你的特別邀請函
      </p>
    </section>
  `;

  const envelope =
    document.getElementById("envelope");

  envelope.addEventListener(
    "click",
    openEnvelope
  );

  envelope.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openEnvelope();
      }
    }
  );
}

function openEnvelope() {
  const envelope =
    document.getElementById("envelope");

  if (!envelope) {
    return;
  }

  if (
    envelope.classList.contains("opening")
  ) {
    return;
  }

  envelope.classList.add("opening");

  setTimeout(() => {
    showInvitationLetter();
  }, 1200);
}

/* =====================================================
   邀請函
===================================================== */

function showInvitationLetter() {
  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper">
        <div class="letter-stamp">
          SPECIAL<br>
          MAIL
        </div>

        <div class="postmark">
          SPECIAL<br>
          MAIL
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            SPECIAL INVITATION
          </p>

          <h1>《月底不吃土！》</h1>

          <h2>大學生月光族生存戰</h2>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="letter-text">
            <p>親愛的玩家：</p>

            <p>
              你收到了一封特別的邀請函！
            </p>

            <p>
              這個月，你將成為一名大學生，
              面對各種生活開銷、購物誘惑與突發事件。
            </p>

            <p>
              你能在有限的生活費中，
              兼顧健康、快樂與金錢管理嗎？
            </p>
          </div>

          <button
            id="accept-button"
            class="letter-button"
            type="button"
          >
            接受邀請
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById("accept-button")
    .addEventListener(
      "click",
      showInstructions
    );
}

/* =====================================================
   遊戲說明
===================================================== */

function showInstructions() {
  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper">
        <div class="letter-stamp">
          GAME<br>
          RULES
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            WELCOME LETTER
          </p>

          <h1>遊戲說明</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="letter-text">
            <p>親愛的玩家：</p>

            <p>
              你將擁有 NT $12,000 的生活費，
              在四週內安排自己的大學生活。
            </p>

            <p>
              每完成一個一般情境後，
              有 20% 機率收到一封選擇型隨機事件。
            </p>

            <p>
              每完成一個一般情境後，
              也有 60% 機率出現一題 directEvents。
            </p>

            <p>
              directEvents2 會在遊戲開始時，
              決定本局總共出現 3～6 題，
              每次只隨機出現一題。
            </p>

            <ul>
              <li>💰 剩餘金錢</li>
              <li>♡ 健康值</li>
              <li>☺ 快樂值</li>
            </ul>
          </div>

          <button
            id="start-button"
            class="letter-button"
            type="button"
          >
            我知道了，開始挑戰
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById("start-button")
    .addEventListener(
      "click",
      startGame
    );
}

/* =====================================================
   開始遊戲
===================================================== */

function startGame() {
  resetGame();
  renderRegularQuestion();
}

/* =====================================================
   顯示一般題目
===================================================== */

function renderRegularQuestion() {
  if (checkImmediateEnding()) {
    return;
  }

  const question =
    getCurrentRegularQuestion();

  if (!question) {
    if (game.week >= 4) {
      showFinalResult();
    } else {
      showWeekComplete();
    }

    return;
  }

  if (!hasAffordableOption(question)) {
    showFinancialFailure();
    return;
  }

  const screen =
    document.getElementById("screen");

  const optionsHTML =
    question.options
      .map((option, index) => {
        const expense =
          getExpense(option);

        const insufficient =
          expense > game.money;

        return `
          <button
            class="choice-button"
            type="button"
            data-choice-index="${index}"
            ${insufficient ? "disabled" : ""}
          >
            <strong>
              ${String.fromCharCode(65 + index)}.
            </strong>

            ${option.title}

            <small>
              ${
                option.money > 0
                  ? "收入：" +
                    formatMoney(option.money)
                  : option.money < 0
                    ? "支出：" +
                      formatMoney(expense)
                    : "不需額外支出"
              }

              ${
                insufficient
                  ? "｜目前餘額不足"
                  : ""
              }
            </small>
          </button>
        `;
      })
      .join("");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper choice-paper">
        <div class="letter-stamp">
          WEEK<br>
          0${game.week}
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            WEEK 0${game.week}｜DAILY CHOICE
          </p>

          ${renderStatus()}

          <h1>${question.title}</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="letter-text">
            <p>${question.text}</p>
          </div>

          <div class="letter-options">
            ${optionsHTML}
          </div>
        </div>
      </article>
    </section>
  `;

  document
    .querySelectorAll("[data-choice-index]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          chooseRegularOption(
            Number(button.dataset.choiceIndex)
          );
        }
      );
    });
}

/* =====================================================
   一般題目選擇
===================================================== */

function chooseRegularOption(index) {
  const question =
    getCurrentRegularQuestion();

  if (!question) {
    return;
  }

  const option =
    question.options[index];

  if (!option) {
    return;
  }

  if (
    getExpense(option) >
    game.money
  ) {
    return;
  }

  const result =
    applyOption(
      question,
      option,
      "一般情境"
    );

  game.currentResult = result;

  if (checkImmediateEnding()) {
    return;
  }

  renderRegularResult();
}

/* =====================================================
   套用玩家選擇效果
===================================================== */

function applyOption(
  question,
  option,
  sourceType
) {
  const previousMoney =
    game.money;

  const previousHealth =
    game.health;

  const previousHappiness =
    game.happiness;

  const expense =
    getExpense(option);

  const income =
    Math.max(
      0,
      Number(option.money) || 0
    );

  game.money =
    Math.max(
      0,
      game.money +
      Number(option.money || 0)
    );

  /*
    每次玩家選擇，健康值額外 -2
  */
  game.health =
    clamp(
      game.health +
      Number(option.health || 0) -
      CHOICE_HEALTH_COST
    );

  game.happiness =
    clamp(
      game.happiness +
      Number(option.happiness || 0)
    );

  game.totalSpent += expense;
  game.totalIncome += income;

  if (
    expense > 0 &&
    game.spending[question.category] !== undefined
  ) {
    game.spending[question.category] += expense;
  }

  game.records.push({
    source: sourceType,
    week: game.week,
    title: question.title,
    choice: option.title,
    category: question.category,
    money: Number(option.money || 0),
    health: Number(option.health || 0),
    happiness: Number(option.happiness || 0),
    extraHealthCost: CHOICE_HEALTH_COST
  });

  return {
    question,
    option,

    moneyChange:
      game.money - previousMoney,

    healthChange:
      game.health - previousHealth,

    happinessChange:
      game.happiness -
      previousHappiness
  };
}

/* =====================================================
   一般題目回饋
===================================================== */

function renderRegularResult() {
  const result =
    game.currentResult;

  const option =
    result.option;

  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper reply-paper">
        <div class="letter-stamp">
          REPLY<br>
          MAIL
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            REPLY｜LETTER RECEIVED
          </p>

          ${renderStatus()}

          <h1>你的選擇回覆</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="reply-message">
            <p>
              你選擇了：
              <strong>${option.title}</strong>
            </p>

            <p>
              ${option.feedback}
            </p>
          </div>

          <div class="reply-stats">
            <p>
              💰 金錢：
              <strong>
                ${formatMoneyChange(
                  result.moneyChange
                )}
              </strong>
            </p>

            <p>
              ♡ 健康：
              <strong>
                ${formatNumberChange(
                  result.healthChange
                )}
              </strong>
            </p>

            <p>
              ☺ 快樂：
              <strong>
                ${formatNumberChange(
                  result.happinessChange
                )}
              </strong>
            </p>
          </div>

          <button
            id="continue-regular-button"
            class="letter-button"
            type="button"
          >
            下一封邀請函
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById(
      "continue-regular-button"
    )
    .addEventListener(
      "click",
      continueAfterRegularQuestion
    );
}

/* =====================================================
   一般題目完成後的流程
===================================================== */

function continueAfterRegularQuestion() {
  game.pendingProgress = {
    week: game.week,
    questionIndex:
      game.questionIndex + 1
  };

  /*
    先判定 20 題 randomEvents
  */
  const shouldTriggerRandomEvent =
    Math.random() <
    RANDOM_EVENT_CHANCE;

  if (
    shouldTriggerRandomEvent &&
    game.usedEventIds.length <
      randomEvents.length
  ) {
    const event =
      chooseUnusedEvent();

    if (event) {
      game.usedEventIds.push(event.id);

      renderEventQuestion(event);

      return;
    }
  }

  /*
    沒有觸發 randomEvents，
    接著判定 directEvents。
  */
  startDirectEvent();
}

/* =====================================================
   randomEvents 選擇型事件
===================================================== */

function chooseUnusedEvent() {
  const unusedEvents =
    randomEvents.filter((event) => {
      return !game.usedEventIds.includes(
        event.id
      );
    });

  if (
    unusedEvents.length === 0
  ) {
    return null;
  }

  const randomIndex =
    Math.floor(
      Math.random() *
      unusedEvents.length
    );

  return unusedEvents[randomIndex];
}

function renderEventQuestion(event) {
  if (!hasAffordableOption(event)) {
    showFinancialFailure();
    return;
  }

  const screen =
    document.getElementById("screen");

  const optionsHTML =
    event.options
      .map((option, index) => {
        const expense =
          getExpense(option);

        const insufficient =
          expense > game.money;

        return `
          <button
            class="choice-button event-choice-button"
            type="button"
            data-event-choice-index="${index}"
            ${insufficient ? "disabled" : ""}
          >
            <strong>
              ${String.fromCharCode(65 + index)}.
            </strong>

            ${option.title}

            <small>
              ${
                option.money > 0
                  ? "收入：" +
                    formatMoney(option.money)
                  : option.money < 0
                    ? "支出：" +
                      formatMoney(expense)
                    : "不需額外支出"
              }

              ${
                insufficient
                  ? "｜目前餘額不足"
                  : ""
              }
            </small>
          </button>
        `;
      })
      .join("");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper event-paper">
        <div class="letter-stamp">
          SPECIAL<br>
          DELIVERY
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            SPECIAL DELIVERY｜RANDOM EVENT
          </p>

          ${renderStatus()}

          <h1>${event.title}</h1>

          <div class="letter-divider">
            ───────── ⚠ ─────────
          </div>

          <div class="letter-text">
            <p>${event.text}</p>
          </div>

          <div class="letter-options">
            ${optionsHTML}
          </div>
        </div>
      </article>
    </section>
  `;

  document
    .querySelectorAll(
      "[data-event-choice-index]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          chooseEventOption(
            event,
            Number(
              button.dataset.eventChoiceIndex
            )
          );
        }
      );
    });
}

function chooseEventOption(
  event,
  index
) {
  const option =
    event.options[index];

  if (!option) {
    return;
  }

  if (
    getExpense(option) >
    game.money
  ) {
    return;
  }

  const result =
    applyOption(
      event,
      option,
      "選擇型隨機事件"
    );

  game.currentResult = result;

  if (checkImmediateEnding()) {
    return;
  }

  renderEventResult();
}

function renderEventResult() {
  const result =
    game.currentResult;

  const option =
    result.option;

  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper event-paper reply-paper">
        <div class="letter-stamp">
          EVENT<br>
          REPLY
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            SPECIAL EVENT REPLY
          </p>

          ${renderStatus()}

          <h1>事件處理結果</h1>

          <div class="letter-divider">
            ───────── ⚠ ─────────
          </div>

          <div class="reply-message">
            <p>
              你選擇了：
              <strong>${option.title}</strong>
            </p>

            <p>
              ${option.feedback}
            </p>
          </div>

          <div class="reply-stats">
            <p>
              💰 金錢：
              <strong>
                ${formatMoneyChange(
                  result.moneyChange
                )}
              </strong>
            </p>

            <p>
              ♡ 健康：
              <strong>
                ${formatNumberChange(
                  result.healthChange
                )}
              </strong>
            </p>

            <p>
              ☺ 快樂：
              <strong>
                ${formatNumberChange(
                  result.happinessChange
                )}
              </strong>
            </p>
          </div>

          <button
            id="continue-event-button"
            class="letter-button"
            type="button"
          >
            繼續生活
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById(
      "continue-event-button"
    )
    .addEventListener(
      "click",
      startDirectEvent
    );
}

/* =====================================================
   directEvents 第一組
   每個必填題後 60% 機率抽 1 題
===================================================== */

function startDirectEvent() {
  const shouldTrigger =
    Math.random() <
    DIRECT_EVENT_CHANCE;

  if (
    shouldTrigger &&
    game.usedDirectEventIds.length <
      directEvents.length
  ) {
    const unusedEvents =
      directEvents.filter((event) => {
        return !game.usedDirectEventIds.includes(
          event.id
        );
      });

    if (
      unusedEvents.length > 0
    ) {
      const randomIndex =
        Math.floor(
          Math.random() *
          unusedEvents.length
        );

      const event =
        unusedEvents[randomIndex];

      game.usedDirectEventIds.push(
        event.id
      );

      renderDirectEvent(event);
      return;
    }
  }

  startDirectEvents2();
}

function applyDirectEvent(event) {
  const moneyChange =
    Number(event.money) || 0;

  const healthChange =
    Number(event.health) || 0;

  const happinessChange =
    Number(event.happiness) || 0;

  const expense =
    Math.max(0, -moneyChange);

  const income =
    Math.max(0, moneyChange);

  game.money =
    Math.max(
      0,
      game.money + moneyChange
    );

  game.health =
    clamp(
      game.health + healthChange
    );

  game.happiness =
    clamp(
      game.happiness + happinessChange
    );

  game.totalSpent += expense;
  game.totalIncome += income;

  if (expense > 0) {
    game.spending.其他 += expense;
  }

  game.records.push({
    source: "directEvents",
    week: game.week,
    title: event.title,
    choice: "直接套用",
    category: "其他",
    money: moneyChange,
    health: healthChange,
    happiness: happinessChange
  });
}

function renderDirectEvent(event) {
  applyDirectEvent(event);

  if (checkImmediateEnding()) {
    return;
  }

  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper direct-event-paper">
        <div class="letter-stamp">
          DAILY<br>
          EVENT
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            DIRECT EVENT｜突發事件
          </p>

          ${renderStatus()}

          <h1>${event.title}</h1>

          <div class="letter-divider">
            ───────── ✦ ─────────
          </div>

          <div class="letter-text">
            <p>${event.text}</p>
          </div>

          <div class="reply-stats">
            <p>
              💰 金錢：
              <strong>
                ${formatMoneyChange(event.money)}
              </strong>
            </p>

            <p>
              ♡ 健康：
              <strong>
                ${formatNumberChange(event.health)}
              </strong>
            </p>

            <p>
              ☺ 快樂：
              <strong>
                ${formatNumberChange(event.happiness)}
              </strong>
            </p>
          </div>

          <button
            id="continue-direct-button"
            class="letter-button"
            type="button"
          >
            繼續遊戲
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById(
      "continue-direct-button"
    )
    .addEventListener(
      "click",
      startDirectEvents2
    );
}

/* =====================================================
   directEvents2 第二組
===================================================== */

function startDirectEvents2() {
  /*
    如果已經達到本局總題數，
    就直接回到原本進度。
  */
  if (
    game.directEvents2Count >=
    game.directEvents2Target
  ) {
    continueToPendingProgress();
    return;
  }

  /*
    每題完成後，以 50% 機率出現 directEvents2。
  */
  const shouldTrigger =
    Math.random() <
    DIRECT_EVENT_2_CHANCE;

  if (!shouldTrigger) {
    continueToPendingProgress();
    return;
  }

  /*
    找出還沒有出現過的第二組事件。
  */
  const unusedEvents =
    directEvents2.filter((event) => {
      return !game.usedDirectEventIds2.includes(
        event.id
      );
    });

  if (
    unusedEvents.length === 0
  ) {
    continueToPendingProgress();
    return;
  }

  /*
    每次只隨機抽 1 題。
  */
  const randomIndex =
    Math.floor(
      Math.random() *
      unusedEvents.length
    );

  const event =
    unusedEvents[randomIndex];

  game.usedDirectEventIds2.push(
    event.id
  );

  game.directEvents2Count++;

  renderDirectEvent2(event);
}

function applyDirectEvent2(event) {
  const moneyChange =
    Number(event.money) || 0;

  const healthChange =
    Number(event.health) || 0;

  const happinessChange =
    Number(event.happiness) || 0;

  const expense =
    Math.max(0, -moneyChange);

  const income =
    Math.max(0, moneyChange);

  game.money =
    Math.max(
      0,
      game.money + moneyChange
    );

  game.health =
    clamp(
      game.health + healthChange
    );

  game.happiness =
    clamp(
      game.happiness + happinessChange
    );

  game.totalSpent += expense;
  game.totalIncome += income;

  if (expense > 0) {
    game.spending.其他 += expense;
  }

  game.records.push({
    source: "directEvents2",
    week: game.week,
    title: event.title,
    choice: "直接套用",
    category: "其他",
    money: moneyChange,
    health: healthChange,
    happiness: happinessChange
  });
}

function renderDirectEvent2(event) {
  applyDirectEvent2(event);

  if (checkImmediateEnding()) {
    return;
  }

  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper direct-event-paper">
        <div class="letter-stamp">
          DAILY<br>
          EVENT
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            DIRECT EVENTS2｜日常突發事件
          </p>

          ${renderStatus()}

          <h1>${event.title}</h1>

          <div class="letter-divider">
            ───────── ✦ ─────────
          </div>

          <div class="letter-text">
            <p>${event.text}</p>
          </div>

          <div class="reply-stats">
            <p>
              💰 金錢：
              <strong>
                ${formatMoneyChange(event.money)}
              </strong>
            </p>

            <p>
              ♡ 健康：
              <strong>
                ${formatNumberChange(event.health)}
              </strong>
            </p>

            <p>
              ☺ 快樂：
              <strong>
                ${formatNumberChange(event.happiness)}
              </strong>
            </p>

            <p>
              本局進度：
              <strong>
                ${game.directEvents2Count}
                /
                ${game.directEvents2Target}
              </strong>
            </p>
          </div>

          <button
            id="continue-direct2-button"
            class="letter-button"
            type="button"
          >
            繼續原本進度
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById(
      "continue-direct2-button"
    )
    .addEventListener(
      "click",
      continueToPendingProgress
    );
}

/* =====================================================
   低健康與低快樂特殊情境
===================================================== */

const tiredQuestion = {
  id: "special-tired",
  category: "其他",
  title: "疲勞來信",
  text: "最近似乎太累了，精神狀態不太好。你想怎麼調整？",
  options: [
    {
      title: "先休息再處理事情",
      money: 0,
      health: 8,
      happiness: 2,
      feedback: "你先讓自己休息，身體狀態逐漸恢復。"
    },
    {
      title: "買營養餐補充體力",
      money: -250,
      health: 5,
      happiness: 3,
      feedback: "你花了一點錢照顧自己，也替身體補充能量。"
    },
    {
      title: "硬撐完成今天安排",
      money: 0,
      health: -8,
      happiness: -5,
      feedback: "你完成了原本的安排，但身體和心情承受更多負擔。"
    }
  ]
};

const relaxQuestion = {
  id: "special-relax",
  category: "娛樂",
  title: "想放鬆一下",
  text: "最近的生活讓你有點悶，或許可以安排一點休息時間。",
  options: [
    {
      title: "去看電影放鬆",
      money: -400,
      health: 1,
      happiness: 12,
      feedback: "你用一筆娛樂支出換來完整的放鬆時間。"
    },
    {
      title: "在家免費休息",
      money: 0,
      health: 2,
      happiness: 6,
      feedback: "你選擇零支出的休息方式，也成功讓自己放鬆下來。"
    },
    {
      title: "找朋友散步聊天",
      money: -80,
      health: 2,
      happiness: 8,
      feedback: "和朋友走走聊聊，讓你重新找回生活節奏。"
    }
  ]
};

function checkLowConditionBeforeNextQuestion() {
  if (
    game.health < 40 &&
    Math.random() <
      SPECIAL_CONDITION_CHANCE
  ) {
    renderSpecialQuestion(tiredQuestion);
    return true;
  }

  if (
    game.happiness < 40 &&
    Math.random() <
      SPECIAL_CONDITION_CHANCE
  ) {
    renderSpecialQuestion(relaxQuestion);
    return true;
  }

  return false;
}

function renderSpecialQuestion(question) {
  if (!hasAffordableOption(question)) {
    showFinancialFailure();
    return;
  }

  const screen =
    document.getElementById("screen");

  const optionsHTML =
    question.options
      .map((option, index) => {
        const expense =
          getExpense(option);

        const insufficient =
          expense > game.money;

        return `
          <button
            class="choice-button"
            type="button"
            data-special-choice-index="${index}"
            ${insufficient ? "disabled" : ""}
          >
            <strong>
              ${String.fromCharCode(65 + index)}.
            </strong>

            ${option.title}

            <small>
              ${
                option.money < 0
                  ? "支出：" +
                    formatMoney(expense)
                  : "不需額外支出"
              }

              ${
                insufficient
                  ? "｜目前餘額不足"
                  : ""
              }
            </small>
          </button>
        `;
      })
      .join("");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper event-paper">
        <div class="letter-stamp">
          SPECIAL<br>
          CARE
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            SPECIAL LIFE CONDITION
          </p>

          ${renderStatus()}

          <h1>${question.title}</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="letter-text">
            <p>${question.text}</p>
          </div>

          <div class="letter-options">
            ${optionsHTML}
          </div>
        </div>
      </article>
    </section>
  `;

  document
    .querySelectorAll(
      "[data-special-choice-index]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          chooseSpecialOption(
            question,
            Number(
              button.dataset.specialChoiceIndex
            )
          );
        }
      );
    });
}

function chooseSpecialOption(
  question,
  index
) {
  const option =
    question.options[index];

  if (!option) {
    return;
  }

  if (
    getExpense(option) >
    game.money
  ) {
    return;
  }

  const result =
    applyOption(
      question,
      option,
      "低狀態特殊情境"
    );

  game.currentResult = result;

  if (checkImmediateEnding()) {
    return;
  }

  renderSpecialResult();
}

function renderSpecialResult() {
  const result =
    game.currentResult;

  const option =
    result.option;

  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper event-paper reply-paper">
        <div class="letter-stamp">
          CARE<br>
          REPLY
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            SPECIAL CONDITION REPLY
          </p>

          ${renderStatus()}

          <h1>狀態調整結果</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="reply-message">
            <p>
              你選擇了：
              <strong>${option.title}</strong>
            </p>

            <p>
              ${option.feedback}
            </p>
          </div>

          <div class="reply-stats">
            <p>
              💰 金錢：
              <strong>
                ${formatMoneyChange(
                  result.moneyChange
                )}
              </strong>
            </p>

            <p>
              ♡ 健康：
              <strong>
                ${formatNumberChange(
                  result.healthChange
                )}
              </strong>
            </p>

            <p>
              ☺ 快樂：
              <strong>
                ${formatNumberChange(
                  result.happinessChange
                )}
              </strong>
            </p>
          </div>

          <button
            id="continue-special-button"
            class="letter-button"
            type="button"
          >
            繼續生活
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById(
      "continue-special-button"
    )
    .addEventListener(
      "click",
      continueToPendingProgress
    );
}

/* =====================================================
   回到下一題
===================================================== */

function continueToPendingProgress() {
  if (!game.pendingProgress) {
    renderRegularQuestion();
    return;
  }

  game.week =
    game.pendingProgress.week;

  game.questionIndex =
    game.pendingProgress.questionIndex;

  game.pendingProgress = null;
  game.currentResult = null;
  game.selectedChoice = null;

  if (
    game.health < 40 ||
    game.happiness < 40
  ) {
    if (
      checkLowConditionBeforeNextQuestion()
    ) {
      return;
    }
  }

  renderRegularQuestion();
}

/* =====================================================
   每週完成
===================================================== */

function showWeekComplete() {
  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper">
        <div class="letter-stamp">
          WEEK<br>
          DONE
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            WEEK 0${game.week} COMPLETE
          </p>

          ${renderStatus()}

          <h1>本週生活信件已完成！</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="letter-text">
            <p>
              你完成了第 ${game.week} 週的生活安排。
            </p>

            <p>
              下一週還會有新的生活選擇，
              記得按照自己的狀態做決定。
            </p>
          </div>

          <button
            id="next-week-button"
            class="letter-button"
            type="button"
          >
            開啟下一週邀請函
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById("next-week-button")
    .addEventListener("click", () => {
      game.week++;
      game.questionIndex = 0;
      game.currentResult = null;

      if (checkImmediateEnding()) {
        return;
      }

      if (
        checkLowConditionBeforeNextQuestion()
      ) {
        return;
      }

      renderRegularQuestion();
    });
}

/* =====================================================
   稱號與月底結算
===================================================== */

function getTitle() {
  const entertainment =
    game.spending.娛樂 +
    game.spending.購物;

  if (game.money < 100) {
    return "月底吃土大師";
  }

  if (
    game.money >= 5000 &&
    game.health >= 85 &&
    game.happiness >= 85
  ) {
    return "生活平衡大師";
  }

  if (
    game.health >= 90 &&
    game.money >= 3500
  ) {
    return "健康優先型";
  }

  if (
    game.money >= 6500 &&
    game.health >= 65
  ) {
    return "精打細算型";
  }

  if (
    game.happiness >= 88 &&
    entertainment >= 1200
  ) {
    return "享樂生活型";
  }

  if (
    game.money < 2200 &&
    game.health >= 55 &&
    game.happiness >= 55
  ) {
    return "月光族生存者";
  }

  return "預算管理新手";
}

function getSummary() {
  const title =
    getTitle();

  if (
    title === "月底吃土大師"
  ) {
    return "你完成了整個月，但月底剩餘金額幾乎見底。下次可以更早安排備用金。";
  }

  if (
    title === "生活平衡大師"
  ) {
    return "你在金錢、健康和快樂之間取得了很好的平衡，也保留了一部分備用金。";
  }

  if (
    title === "健康優先型"
  ) {
    return "你很重視身體狀態，願意把資源放在健康和穩定生活上。";
  }

  if (
    title === "精打細算型"
  ) {
    return "你對支出相當敏銳，留下了不少餘裕。";
  }

  if (
    title === "享樂生活型"
  ) {
    return "你把不少預算用在社交、購物和娛樂上，生活充滿了回憶。";
  }

  if (
    title === "月光族生存者"
  ) {
    return "你成功撐過了整個月。雖然剩餘金額不多，但也累積了不少生活經驗。";
  }

  return "這個月的選擇很有自己的風格，下次可以試著更早分配備用金。";
}

function renderSpendingList() {
  return Object.entries(
    game.spending
  )
    .filter(([, amount]) => {
      return amount > 0;
    })
    .map(([category, amount]) => {
      return `
        <li>
          <span>${category}</span>
          <strong>${formatMoney(amount)}</strong>
        </li>
      `;
    })
    .join("");
}

function showFinalResult() {
  if (checkImmediateEnding()) {
    return;
  }

  const screen =
    document.getElementById("screen");

  screen.innerHTML = `
    <section class="letter-page">
      <article class="letter-paper final-paper">
        <div class="letter-stamp">
          MONTHLY<br>
          REPORT
        </div>

        <div class="letter-content">
          <p class="letter-eyebrow">
            MONTHLY REPORT
          </p>

          ${renderStatus()}

          <h1>月底最終回信</h1>

          <div class="letter-divider">
            ───────── ♡ ─────────
          </div>

          <div class="final-title">
            <span>你的專屬稱號</span>
            <strong>${getTitle()}</strong>
          </div>

          <div class="letter-text">
            <p>親愛的玩家：</p>

            <p>
              恭喜你完成四週生活挑戰！
            </p>

            <p>
              ${getSummary()}
            </p>
          </div>

          <div class="reply-stats">
            <p>
              💰 剩餘金錢：
              <strong>${formatMoney(game.money)}</strong>
            </p>

            <p>
              ♡ 健康值：
              <strong>${game.health}/100</strong>
            </p>

            <p>
              ☺ 快樂值：
              <strong>${game.happiness}/100</strong>
            </p>

            <p>
              本月總支出：
              <strong>${formatMoney(game.totalSpent)}</strong>
            </p>

            <p>
              本月總收入：
              <strong>${formatMoney(game.totalIncome)}</strong>
            </p>

            <p>
              directEvents2 已出現：
              <strong>
                ${game.directEvents2Count} 題
              </strong>
            </p>
          </div>

          <div class="spending-summary">
            <h3>分類支出</h3>

            <ul>
              ${
                renderSpendingList() ||
                "<li>本月沒有支出</li>"
              }
            </ul>
          </div>

          <button
            id="restart-button"
            class="letter-button"
            type="button"
          >
            再玩一次
          </button>

          <br><br>

          <button
            id="home-button"
            class="letter-button"
            type="button"
          >
            返回首頁
          </button>
        </div>
      </article>
    </section>
  `;

  document
    .getElementById("restart-button")
    .addEventListener("click", () => {
      resetGame();
      renderRegularQuestion();
    });

  document
    .getElementById("home-button")
    .addEventListener("click", () => {
      resetGame();
      showEnvelope();
    });
}

/* =====================================================
   啟動遊戲
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    showEnvelope();
  }
);