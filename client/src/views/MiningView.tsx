import styles from "./MiningView.module.css";

const MiningView = () => {
  return (
    <div
      className={styles.container}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "4rem",
      }}
    >
      <p>Mining ⛏️</p>
    </div>
  );
};

export default MiningView;
