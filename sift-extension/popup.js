document.getElementById('siftNow').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = encodeURIComponent(tab.url);
  chrome.tabs.create({ url: `https://sift-lac.vercel.app/?sift=${url}` });
});

document.getElementById('queueLater').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = encodeURIComponent(tab.url);
  chrome.tabs.create({ url: `https://sift-lac.vercel.app/?queue=${url}` });
});