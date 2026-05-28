import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "서버 기본 메시지입니다.",
  });
});

app.listen(3000, () => {
  console.log("서버가 3000번 포트에서 실행 중입니다.");
});
