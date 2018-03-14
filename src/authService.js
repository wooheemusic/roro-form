const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
  exist: (email) => {
    console.log('exist request sent')
    return sleep(2000).then(
      () => {
        console.log('exist request arrived')
        if (email === 'xxx')
          return false
        else
          return true
      }
    )
  },
  submit: (email, password) => {
    console.log('submit request sent')
    sleep(2000).then(()=>
      {
        console.log('submit request arrived')
      }
    )
  }
}