'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { UserProfile, Company } from '@/lib/types';

export function useProfile() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const adminCompanyId = searchParams.get('adminCompanyId');

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isCompanyLoading, setIsCompanyLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // 1. Fetch User Profile
    useEffect(() => {
        if (isAuthLoading) return;

        if (!user) {
            setProfile(null);
            setIsProfileLoading(false);
            return;
        }

        setIsProfileLoading(true);

        // Listen to user profile
        const userRef = doc(firestore, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const profileData = { id: docSnap.id, uid: docSnap.id, ...docSnap.data() } as UserProfile;

                // --- One-time elevation for Super Admin ---
                if (profileData.email === 'magloire078@gmail.com' && profileData.role !== 'superadmin') {
                    updateDoc(userRef, { role: 'superadmin' }).catch(console.error);
                    profileData.role = 'superadmin';
                }

                setProfile(profileData);
            } else {
                // Profile doesn't exist yet
                setProfile(null);
            }
            setIsProfileLoading(false);
        }, (err) => {
            // If we get a permission denied error, it might be because the document doesn't exist yet
            // or the user doesn't have permissions to listen to it before creation.
            // We'll treat this as "no profile" instead of a hard error to allow auto-creation.
            if (err.code === 'permission-denied') {
                // Expected for new users whose profile doesn't exist yet
                setProfile(null);

            } else {
                console.error("Error fetching user profile:", err);
                setError(err);
            }
            setIsProfileLoading(false);
        });

        return () => {
            setTimeout(() => unsubscribeUser(), 100);
        };
    }, [user, isAuthLoading, firestore]);

    // 2. Fetch Company Based on Profile
    useEffect(() => {
        if (isAuthLoading || isProfileLoading) return;

        const targetCompanyId = (profile?.role === 'superadmin' && adminCompanyId)
            ? adminCompanyId
            : profile?.companyId;

        if (!targetCompanyId) {
            setCompany(null);
            setIsCompanyLoading(false);
            return;
        }

        setIsCompanyLoading(true);

        const companyRef = doc(firestore, 'companies', targetCompanyId);
        const unsubscribeCompany = onSnapshot(companyRef, (companySnap) => {
            if (companySnap.exists()) {
                setCompany({ id: companySnap.id, ...companySnap.data() } as Company);
            } else {
                setCompany(null);
            }
            setIsCompanyLoading(false);
        }, (err) => {
            // Silent error for company fetch during initial setup
            if (err.code !== 'permission-denied') {
                console.error("Error fetching company:", err);
                setError(err);
            }
            setIsCompanyLoading(false);
        });

        return () => {
            setTimeout(() => unsubscribeCompany(), 100);
        };
    }, [profile, isAuthLoading, isProfileLoading, adminCompanyId, firestore]);

    return {
        profile,
        company,
        isLoading: isAuthLoading || isProfileLoading || isCompanyLoading,
        error,
        isOwner: profile?.role === 'owner',
        isEmployee: profile?.role === 'employee',
        isSuperAdmin: profile?.role === 'superadmin',
    };
}
