"use client"
import React, { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Icon } from "@iconify/react"
import { Checkbox } from "@/components/ui/checkbox"
import logo from "@/public/images/logo/logo_tracegrid.png"
import { useUser } from "@/context/UserContext"
import { setSession } from "@/lib/session"

const schema = z.object({
  username: z.string().min(4),
  password: z.string().min(4)
})

const DeveloperLogInForm = () => {
  const [isPending, startTransition] = useTransition()
  const [passwordType, setPasswordType] = useState("password")
  const UserContext = useUser()
  const [isServerError, setIsServerError] = useState(false)
  const [responsStatus, setResponsStatus] = useState("")
  const [isUnexpectedError, setIsUnexpectedError] = useState(false)
  const router = useRouter()

  const [isAuthError, setIsAuthError] = useState(false)
  const { setUser } = UserContext.operations

  const togglePasswordType = () => {
    if (passwordType === "text") {
      setPasswordType("password")
    } else if (passwordType === "password") {
      setPasswordType("text")
    }
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      username: "",
      password: ""
    }
  })

  const onSubmit = async (data) => {
    setIsAuthError(false)
    setIsServerError(false)
    setIsUnexpectedError(false)

    startTransition(async () => {
      try {
        // For developer, we reuse client login endpoint for now
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/dev/auth_login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: data.username,
              password: data.password
            })
          }
        )
        debugger

        if (!response.ok) {
          handleResponseError(response)
        } else {
          handleSuccess(await response.json(), data)
        }
      } catch (error) {
        handleFetchError(error)
      }
    })
  }

  const handleResponseError = async (response) => {
    if (response.status === 401) {
      setIsAuthError(true)
    } else if (response.status === 503) {
      setIsServerError(true)
      setResponsStatus("Maintenance")
    } else {
      setIsUnexpectedError(true)
      setResponsStatus("Unexpected Error")
    }
  }

  const handleSuccess = async (result, data) => {
    toast.success("Login Successful")

    const userData = {
      token: result.access_token,
      username: data.username,
      password: data.password,
      role: "developer"
    }

    // Set user in context
    setUser(userData)

    // Store session and enforce mutual exclusivity (developer vs client/manager)
    setSession("developer", userData)

    router.push("/developer/translations")
    reset()
  }

  const handleFetchError = (error) => {
    console.error("Fetch error:", error)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      setIsServerError(true)
      setResponsStatus("Connection Error")
    } else {
      toast.error("Login Failed")
    }
  }

  return (
    <div className='w-full py-10'>
      <Image src={logo} alt='' objectFit='cover' height={"100%"} width={"100%"} />
      <div className='2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900'>
        Developer Login
      </div>
      {isServerError && (
        <div className='login-failed-box border border-red-600 rounded-lg p-4 mt-4'>
          <div className='login-failed-message text-red-600'>
            <p>
              <strong>Login failed:</strong> {responsStatus}
            </p>
          </div>
        </div>
      )}
      {isAuthError && (
        <div className='login-failed-box border border-red-600 rounded-lg p-4 mt-4'>
          <div className='login-failed-message text-red-600'>Login failed: Invalid credentials</div>
        </div>
      )}
      {isUnexpectedError && (
        <div className='login-failed-box border border-red-600 rounded-lg p-4 mt-4'>
          <div className='login-failed-message text-red-600'>Login failed: {responsStatus}</div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className='mt-5 2xl:mt-7'>
        <div>
          <Label htmlFor='username' className='mb-2 font-medium text-default-600'>
            Username{" "}
          </Label>
          <Input
            disabled={isPending}
            {...register("username")}
            type='text'
            id='username'
            className={cn("", {
              "border-destructive": errors.username
            })}
            size={"lg"}
          />
        </div>
        {errors.username && <div className=' text-destructive mt-2'>{errors.username.message}</div>}

        <div className='mt-3.5'>
          <Label htmlFor='password' className='mb-2 font-medium text-default-600'>
            Password{" "}
          </Label>
          <div className='relative'>
            <Input
              disabled={isPending}
              {...register("password")}
              type={passwordType}
              id='password'
              className='peer '
              size={"lg"}
              placeholder=' '
            />

            <div
              className='absolute top-1/2 -translate-y-1/2 right-4 cursor-pointer'
              onClick={togglePasswordType}
            >
              {passwordType === "password" ? (
                <Icon icon='heroicons:eye' className='w-5 h-5 text-default-400' />
              ) : (
                <Icon icon='heroicons:eye-slash' className='w-5 h-5 text-default-400' />
              )}
            </div>
          </div>
        </div>
        {errors.password && <div className=' text-destructive mt-2'>{errors.password.message}</div>}

        <div className='mt-5  mb-8 flex flex-wrap gap-2'>
          <div className='flex-1 flex  items-center gap-1.5 '>
            <Checkbox size='sm' className='border-default-300 mt-[1px]' id='isRemebered' />
            <Label
              htmlFor='isRemebered'
              className='text-sm text-default-600 cursor-pointer whitespace-nowrap'
            >
              Remember me
            </Label>
          </div>
        </div>
        <Button className='w-full' disabled={isPending} size={"md"}>
          {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {isPending ? "Loading..." : "Sign In"}
        </Button>
      </form>
    </div>
  )
}

export default DeveloperLogInForm
