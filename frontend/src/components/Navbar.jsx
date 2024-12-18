import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Navbar = () => {
  const navigate = useNavigate()
  const { userData, backendUrl, setUserData, setIsLoggedin } = useContext(AppContext)

  const sendVerificationOTP = async () => {
   
    try {
      axios.defaults.withCredentials = true;

      const { data } = await axios.post(backendUrl + '/user/send-verify-OTP')

      if (data.success) {
        navigate('/email-verify')
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)

    }
  }

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/user/logout')
      data.success && setIsLoggedin(false)
      data.success && setUserData(false)
      navigate('/')

    } catch (error) {
      toast.error(error.message)

    }
  }

  return (
    <div className='w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0' >
      <img src={assets.logo} alt='' className='w-28 sm:w-32' />

      {userData ?
        <button
          className='w-8 h-8 flex justify-center items-center rounded-full bg-black text-white relative group focus:outline-none'
          aria-label="User Menu"
        >
          {/* If user data is available */}
          {/* Get the first letter of the user's name */}
          {userData.username[0].toUpperCase()}

          {/* Dropdown menu */}
          <div className='absolute hidden group-hover:block group-focus:block top-0 right-0 z-10 text-black rounded pt-10'>
            <ul className='list-none m-0 p-2 bg-gray-100 text-sm shadow-md whitespace-nowrap'>

              {/* when the user is not verified, "verify email" would be displayed and if the user id already verified then display only the logout */}
              {!userData.isAccountVerified && <li onClick={sendVerificationOTP}
                className="hover:bg-gray-200 cursor-pointer px-2 py-1">Verify Email</li>}

              <li onClick={logout} className="hover:bg-gray-200 cursor-pointer py-1">Logout</li>
            </ul>
          </div>
        </button>


        :

        // if not
        <button onClick={() => navigate('/login')}
          className='flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2
      text-gray-800 hover:bg-gray-100 transition-all'>

          Login

          <img src={assets.arrow_icon} alt='' />
        </button>
      }

    </div>
  )
}

export default Navbar
