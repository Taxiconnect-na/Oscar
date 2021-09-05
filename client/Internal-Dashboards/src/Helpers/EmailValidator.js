const EmailValidator = (email) => {
  let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (reg.test(email.trim()) === false) {
    return false;
  } else {
    return true;
  }
};

export default EmailValidator;
