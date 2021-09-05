import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";

import SOCKET_CORE from "../socket";
import { useHistory } from "react-router-dom";

import classes from "./login.module.css";
import LogoGeneric from "../../logotaxiconnect.png";
import { AiOutlineSecurityScan } from "react-icons/ai";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import EmailValidator from "../../Helpers/EmailValidator";

// const navigate = (route) => {
//     const history = useHistory();

//     function handleClick() {
//       history.push("/home");
//     }

//     return (
//       <button type="button" onClick={handleClick}>
//         Go home
//       </button>
//     );
//   }

class Login extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      foundError: false, //If an error occured while checking - default: false
      isLoading: false, //If it's loading or not - default: false
      showPinInput: false, //Responsible to show or not the pin input part - default: false
      corporate_email: null, //Login email
      password: null, //Login password
      pin: null,
      email_error_color: "#d0d0d0",
      password_error_color: "#d0d0d0",
      pin_error_color: "#d0d0d0",
      admin_fp_tmp: null, //Will temporarily hold the fp
    };
  }

  componentDidMount() {
    let globalObject = this;

    //?Auto redirect
    if (this.props.App.loginData.isLoggedIn) {
      this.setState({ isLoading: true });
      setTimeout(function () {
        globalObject.props.history.push("/overview");
      }, 2000);
    }

    this.props.App.SOCKET_CORE =
      this.props.App.SOCKET_CORE.on === undefined ||
      this.props.App.SOCKET_CORE.on === null
        ? SOCKET_CORE
        : this.props.App.SOCKET_CORE;

    //Handle socket events
    this.props.App.SOCKET_CORE.on(
      "authenticate_internal_admin-response",
      function (response) {
        // alert(JSON.stringify(response));
        globalObject.setState({ isLoading: false });
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          response.response !== null
        ) {
          if (
            /failed_auth/i.test(response.response) ||
            /unknown_admin/i.test(response.response)
          ) {
            //Unknown user
            globalObject.setState({ foundError: true });
          } else {
            //1. Step 1 complete
            if (/authenticated_user_step_1/i.test(response.response.status)) {
              globalObject.setState({
                showPinInput: true,
                admin_fp_tmp: response.response.admin_fp,
              });
            } else if (
              /authenticated_user_step_2/i.test(response.response.status)
            ) {
              //Nice
              if (response.response.status.isSuspended) {
                //! Suspended
                globalObject.setState({ foundError: true });
              } //Good
              else {
                globalObject.setState({ isLoading: true });
                //Update the redux store with the global data
                // alert("Login successfull, update Redux");
                //? Auto navigate to home
                setTimeout(function () {
                  globalObject.props.UpdateSuccessfullLoginDetails(
                    response.response
                  );
                  globalObject.props.history.push("/overview");
                }, 2000);
              }
            }
          }
        } //Error
        else {
          globalObject.setState({ foundError: true });
        }
      }
    );
  }

  /**
   * Responsible for coordinating the login in phases.
   * @param step: 1 : email/password - if pass - step 2
   * @param step: 2 : security pin - if pass - login
   */
  checkInputDataForValidity(step) {
    this.state.corporate_email =
      this.state.corporate_email === null ||
      this.state.corporate_email === undefined
        ? ""
        : this.state.corporate_email;
    this.state.password =
      this.state.password === null || this.state.password === undefined
        ? ""
        : this.state.password;
    this.state.pin =
      this.state.pin === null || this.state.pin === undefined
        ? ""
        : this.state.pin;
    //----
    console.log(this.state.corporate_email);

    if (step === 1) {
      if (EmailValidator(this.state.corporate_email)) {
        console.log("email valid");
        if (this.state.password.length >= 8) {
          console.log("All good");
          //Looks good
          this.setState({ isLoading: true });
          this.props.App.SOCKET_CORE.emit("authenticate_internal_admin", {
            email: this.state.corporate_email,
            password: this.state.password,
          });
        } //Looks wrong
        else {
          console.log("password short");
          this.setState({
            password_error_color: "red",
          });
        }
      } //Error email
      else {
        console.log("email invalid");
        this.setState({
          email_error_color: "red",
        });
      }
    } else if (step === 2) {
      //secu pin
      if (this.state.pin.length === 6) {
        //Everything good
        this.setState({ isLoading: true });
        this.props.App.SOCKET_CORE.emit("authenticate_internal_admin", {
          admin_fp: this.state.admin_fp_tmp,
          pin: this.state.pin,
        });
      } //Wrong pin
      else {
        this.setState({
          pin_error_color: "red",
        });
      }
    }
  }

  onFocusReformat(name) {
    if (/email/i.test(name)) {
      //Reset the mail style
      this.setState({
        email_error_color: "#d0d0d0",
      });
    } else if (/password/i.test(name)) {
      //Reset password
      this.setState({
        password_error_color: "#d0d0d0",
      });
    } else if (/pin/i.test(name)) {
      //Reset pin
      this.setState({
        pin_error_color: "#d0d0d0",
      });
    }
  }

  render() {
    return (
      <div className={classes.mainContainer}>
        <div className={classes.header}>
          <div className={classes.logoContainer}>
            <img
              alt="logo"
              src={LogoGeneric}
              className={classes.trueImageLogo}
            />
          </div>
          <div className={classes.mainTitle}>Administration</div>
        </div>
        <div className={classes.contentContainer}>
          {this.state.foundError === false &&
          this.state.isLoading === false &&
          this.state.showPinInput === false ? (
            <>
              <input
                className={classes.basicInputStyle}
                style={{
                  borderColor: this.state.email_error_color,
                  backgroundColor: "#fff",
                }}
                onFocus={() => this.onFocusReformat("email")}
                onChange={(event) =>
                  this.setState({ corporate_email: event.target.value })
                }
                type="text"
                spellCheck={false}
                autoComplete="false"
                autoCapitalize="false"
                autoCorrect="false"
                placeholder="corporate email"
              />
              <input
                className={classes.basicInputStyle}
                style={{
                  borderColor: this.state.password_error_color,
                  backgroundColor: "#fff",
                }}
                onFocus={() => this.onFocusReformat("password")}
                onChange={(event) =>
                  this.setState({ password: event.target.value })
                }
                type="password"
                spellCheck={false}
                autoComplete="false"
                autoCapitalize="false"
                autoCorrect="false"
                placeholder="Password"
              />
              <br />
              <input
                className={classes.basicInputStyleSubmit}
                type="submit"
                value="Next"
                onClick={() => this.checkInputDataForValidity(1)}
              />
            </>
          ) : this.state.foundError &&
            this.state.isLoading === false &&
            this.state.showPinInput === false ? (
            <div className={classes.errorContainer}>
              <div>
                <AiOutlineSecurityScan
                  style={{ width: 55, height: 55, color: "#b22222" }}
                />
              </div>
              <div className={classes.textWarning}>
                You do not have permission to be here, please contact your
                system administrator or just leave.
              </div>
            </div>
          ) : this.state.isLoading === false && this.state.showPinInput ? (
            <div className={classes.errorContainer}>
              <input
                className={classes.basicInputStyle}
                style={{
                  borderColor: this.state.pin_error_color,
                  backgroundColor: "#fff",
                }}
                onFocus={() => this.onFocusReformat("pin")}
                onChange={(event) => this.setState({ pin: event.target.value })}
                type="number"
                maxLength={6}
                placeholder="Security Pin"
                spellCheck={false}
                autoComplete="false"
                autoCapitalize="false"
                autoCorrect="false"
              />
              <div className={classes.secuPinNotice}>
                Check your corporate email inbox for the security pin.
              </div>
              <br />
              <input
                className={classes.basicInputStyleSubmit}
                type="submit"
                value="Next"
                onClick={() => this.checkInputDataForValidity(2)}
              />
            </div>
          ) : (
            <div className={classes.errorContainer}>
              <div>
                <Loader
                  type="TailSpin"
                  color="#000"
                  height={50}
                  width={50}
                  timeout={300000000} //3 secs
                />
              </div>
              <div className={classes.textLoading}>Hold on, checking...</div>
            </div>
          )}
        </div>
        <div className={classes.copyright}>
          TaxiConnect 2020. All rights reserved.
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { App } = state;
  return { App };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      UpdateSuccessfullLoginDetails,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Login);
