import classes from "../components/overview/overview.module.css";
import {
  AiOutlineSecurityScan,
  AiTwotoneCalendar,
  AiTwotoneCloseSquare,
} from "react-icons/ai";

const NodeTableExplainer = ({ title, left, right, marginTop }) => {
  return (
    <div
      className={classes.nodeContainer}
      style={{
        marginTop: `${
          marginTop !== undefined && marginTop !== null ? `${marginTop}px` : 0
        }`,
      }}
    >
      {/* Left */}
      <div className={classes.nodeInsideSideContainer}>
        <div className={classes.titleNodeInsider}>{title}</div>
        <div className={classes.podInsideInsider}>
          {/* element */}
          {left.map((element, index) => {
            return (
              <div
                key={index}
                className={classes.lineLabelData}
                style={{
                  borderBottomColor:
                    index + 1 === left.length ? "#fff" : "#d0d0d0",
                }}
              >
                <div className={classes.labelInsido}>
                  <AiTwotoneCloseSquare className={classes.squarePoint} />
                  {element.title}
                </div>
                <div
                  className={classes.dataInsido}
                  style={{
                    color: element.color !== undefined ? element.color : "#000",
                  }}
                >
                  {element.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          border: "1px solid #fff",
          height: "100%",
          width: "100px",
        }}
      ></div>
      {/* Right */}
      <div className={classes.nodeInsideSideContainer}>
        <div className={classes.titleNodeInsider}></div>
        {/* element */}
        <div className={classes.podInsideInsider}>
          {right.map((element, index) => {
            return (
              <div
                key={index}
                className={classes.lineLabelData}
                style={{
                  borderBottomColor:
                    index + 1 === right.length ? "#fff" : "#d0d0d0",
                }}
              >
                <div className={classes.labelInsido}>
                  <AiTwotoneCloseSquare className={classes.squarePoint} />
                  {element.title}
                </div>
                <div
                  className={classes.dataInsido}
                  style={{
                    color: element.color !== undefined ? element.color : "#000",
                  }}
                >
                  {element.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NodeTableExplainer;
